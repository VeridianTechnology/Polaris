-- Server-side search and pagination for the Agora administration user list.
-- Only the service-role Edge Function may execute this function.

create or replace function public.admin_search_agora_users(
  p_search text default '',
  p_page integer default 1,
  p_page_size integer default 25
)
returns table (
  id bigint,
  auth_user_id uuid,
  profile_number bigint,
  twitter_handle text,
  twitter_url text,
  status text,
  has_logged_in boolean,
  created_at timestamptz,
  invitation_status text,
  invitation_expires_at timestamptz,
  invitation_opened_at timestamptz,
  invitation_claimed_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with normalized as (
    select
      lower(regexp_replace(btrim(coalesce(p_search, '')), '^@+', '')) as search,
      greatest(1, coalesce(p_page, 1)) as page,
      least(100, greatest(10, coalesce(p_page_size, 25))) as page_size
  ),
  user_rows as (
    select
      managed.id,
      managed.auth_user_id,
      managed.profile_number,
      managed.twitter_handle,
      managed.twitter_url,
      managed.status,
      managed.has_logged_in,
      managed.created_at,
      case
        when invitation.revoked_at is not null then 'revoked'
        when invitation.claimed_at is not null then 'claimed'
        when invitation.expires_at <= now() then 'expired'
        when invitation.first_opened_at is not null then 'opened'
        when invitation.id is not null then 'pending'
        else 'legacy'
      end as invitation_status,
      invitation.expires_at as invitation_expires_at,
      invitation.first_opened_at as invitation_opened_at,
      invitation.claimed_at as invitation_claimed_at
    from public.agora_managed_users as managed
    left join public.agora_user_invites as invitation
      on invitation.profile_number = managed.profile_number
  ),
  filtered as (
    select user_row.*
    from user_rows as user_row
    cross join normalized
    where normalized.search = ''
       or lower(coalesce(user_row.twitter_handle, '')) like '%' || normalized.search || '%'
       or lower(coalesce(user_row.twitter_url, '')) like '%' || normalized.search || '%'
       or lower(coalesce(user_row.status, '')) like '%' || normalized.search || '%'
       or lower(user_row.invitation_status) like '%' || normalized.search || '%'
       or coalesce(user_row.profile_number::text, '') like '%' || normalized.search || '%'
  )
  select
    filtered.id,
    filtered.auth_user_id,
    filtered.profile_number,
    filtered.twitter_handle,
    filtered.twitter_url,
    filtered.status,
    filtered.has_logged_in,
    filtered.created_at,
    filtered.invitation_status,
    filtered.invitation_expires_at,
    filtered.invitation_opened_at,
    filtered.invitation_claimed_at,
    count(*) over ()::bigint as total_count
  from filtered
  order by filtered.created_at desc, filtered.id desc
  limit (select page_size from normalized)
  offset ((select page from normalized) - 1) * (select page_size from normalized);
$$;

revoke all on function public.admin_search_agora_users(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.admin_search_agora_users(text, integer, integer)
  to service_role;
