-- Previously applied through MCP. Separate invitations from registered Agora users.
--
-- profile_number remains the internal identity allocated before an invitation can
-- be claimed. member_number is the public, registration-ordered identity and is
-- allocated only when a password or PIN credential is created.
--
-- Run after:
--   1. 2026-08-29_agora_invite_claim_onboarding.sql
--   2. 2026-08-29_agora_credential_lockouts.sql
--   3. 2026-08-29_agora_admin_user_search.sql

begin;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_user_credentials') is null
    or to_regclass('public.agora_managed_users') is null then
    raise exception 'Run the Agora invitation and credential migrations before the membership-stats migration.';
  end if;
end;
$$;

alter table public.agora_public_profiles
  add column if not exists member_number bigint;

create sequence if not exists public.agora_member_number_seq as bigint;
alter sequence public.agora_member_number_seq
  owned by public.agora_public_profiles.member_number;

create unique index if not exists agora_public_profiles_member_number_key
  on public.agora_public_profiles (member_number)
  where member_number is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agora_public_profiles_member_number_check'
      and conrelid = 'public.agora_public_profiles'::regclass
  ) then
    alter table public.agora_public_profiles
      add constraint agora_public_profiles_member_number_check
      check (member_number is null or member_number > 0);
  end if;
end;
$$;

-- Resume after any already-assigned member number before backfilling. The loop
-- makes the historical assignment order explicit and deterministic.
select setval(
  'public.agora_member_number_seq'::regclass,
  greatest((select coalesce(max(member_number), 0) from public.agora_public_profiles), 1),
  (select count(*) > 0 from public.agora_public_profiles where member_number is not null)
);

do $$
declare
  registered_profile_number bigint;
begin
  for registered_profile_number in
    select credential.profile_number
    from public.agora_user_credentials as credential
    join public.agora_public_profiles as profile
      on profile.profile_number = credential.profile_number
    where profile.member_number is null
    order by credential.created_at, credential.profile_number
  loop
    update public.agora_public_profiles as profile
    set member_number = nextval('public.agora_member_number_seq'::regclass)
    where profile.profile_number = registered_profile_number
      and profile.member_number is null;
  end loop;
end;
$$;

select setval(
  'public.agora_member_number_seq'::regclass,
  greatest((select coalesce(max(member_number), 0) from public.agora_public_profiles), 1),
  (select count(*) > 0 from public.agora_public_profiles where member_number is not null)
);

-- Every credential creation path, including both invitation claim RPCs, passes
-- through this trigger. This keeps number assignment atomic with registration.
create or replace function public.assign_agora_member_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_member_number bigint;
begin
  update public.agora_public_profiles as profile
  set member_number = nextval('public.agora_member_number_seq'::regclass)
  where profile.profile_number = new.profile_number
    and profile.member_number is null
  returning profile.member_number into assigned_member_number;

  if assigned_member_number is null then
    select profile.member_number
    into assigned_member_number
    from public.agora_public_profiles as profile
    where profile.profile_number = new.profile_number;
  end if;

  if assigned_member_number is null then
    raise exception 'The Agora registration could not be assigned a member number';
  end if;

  return new;
end;
$$;

drop trigger if exists agora_user_credentials_assign_member_number
  on public.agora_user_credentials;
create trigger agora_user_credentials_assign_member_number
before insert on public.agora_user_credentials
for each row execute function public.assign_agora_member_number();

comment on column public.agora_public_profiles.member_number is
  'Stable public number assigned in registration order when the member creates a password or PIN';

-- Invites count administered invitation recipients; reissuing a link to the same
-- person does not double-count them. Users count credentials, which means the
-- person completed registration by selecting a password or PIN.
create or replace function public.get_agora_membership_stats()
returns table (
  invite_count bigint,
  user_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::bigint from public.agora_managed_users),
    (select count(*)::bigint from public.agora_user_credentials);
$$;

-- Keep older frontend builds semantically correct during deployment.
create or replace function public.get_agora_user_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.agora_user_credentials;
$$;

-- Return the new public member number while retaining profile_number as the
-- internal route and ownership key.
drop function if exists public.get_agora_profile(bigint, text);
create function public.get_agora_profile(
  p_profile_number bigint,
  p_session_token text
)
returns table (
  profile_number bigint,
  member_number bigint,
  username text,
  display_name text,
  avatar_index smallint,
  bio text,
  twitter_url text,
  instagram_url text,
  facebook_url text,
  snapchat_url text,
  email text,
  email_is_public boolean,
  anonymous_mode boolean,
  is_owner boolean,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_profile_number bigint;
begin
  current_profile_number := public.require_agora_session(p_session_token);

  return query
  select
    profile.profile_number,
    profile.member_number,
    profile.username,
    profile.display_name,
    profile.avatar_index,
    profile.bio,
    profile.twitter_url,
    profile.instagram_url,
    profile.facebook_url,
    profile.snapchat_url,
    case
      when profile.profile_number = current_profile_number then profile.email
      when profile.email_is_public then profile.email
      else null
    end,
    profile.email_is_public,
    profile.anonymous_mode,
    profile.profile_number = current_profile_number,
    profile.is_admin
  from public.agora_public_profiles as profile
  where profile.profile_number = p_profile_number;
end;
$$;

-- Add registration numbers to the private, service-role-only admin directory.
drop function if exists public.admin_search_agora_users(text, integer, integer);
create function public.admin_search_agora_users(
  p_search text default '',
  p_page integer default 1,
  p_page_size integer default 25
)
returns table (
  id bigint,
  auth_user_id uuid,
  profile_number bigint,
  member_number bigint,
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
      profile.member_number,
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
    left join public.agora_public_profiles as profile
      on profile.profile_number = managed.profile_number
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
       or coalesce(user_row.member_number::text, '') like '%' || normalized.search || '%'
  )
  select
    filtered.id,
    filtered.auth_user_id,
    filtered.profile_number,
    filtered.member_number,
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

revoke all on sequence public.agora_member_number_seq
  from public, anon, authenticated;
revoke all on function public.assign_agora_member_number()
  from public, anon, authenticated;
revoke all on function public.get_agora_membership_stats()
  from public, anon, authenticated;
revoke all on function public.get_agora_user_count()
  from public, anon, authenticated;
revoke all on function public.get_agora_profile(bigint, text)
  from public, anon, authenticated;
revoke all on function public.admin_search_agora_users(text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.get_agora_membership_stats()
  to anon, authenticated;
grant execute on function public.get_agora_user_count()
  to anon, authenticated;
grant execute on function public.get_agora_profile(bigint, text)
  to anon, authenticated;
grant execute on function public.admin_search_agora_users(text, integer, integer)
  to service_role;

commit;
