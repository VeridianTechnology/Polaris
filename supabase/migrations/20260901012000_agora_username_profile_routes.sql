-- Canonical Agora profile routes use public usernames instead of numeric IDs.
-- Numeric profile_number values remain internal relational keys.

begin;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_comment_feed') is null
    or to_regprocedure('public.require_agora_session(text)') is null then
    raise exception 'Run the Agora profile and private-read migrations first';
  end if;
end;
$$;

-- Append the public username so authenticated feed links can use canonical URLs.
create or replace view public.agora_comment_feed as
select
  comment.id,
  comment.post_number,
  comment.parent_id,
  case when comment.is_anonymous then null else comment.profile_number end as profile_number,
  case
    when comment.is_anonymous then 'ANON'
    else coalesce(public_profile.display_name, comment.guest_name, 'Agora Member')
  end as author_name,
  case when comment.is_anonymous then null else public_profile.avatar_index end as avatar_index,
  comment.body,
  comment.visible_character_count,
  comment.created_at,
  comment.likes_count,
  comment.dislikes_count,
  comment.is_anonymous,
  case when comment.is_anonymous then false else coalesce(public_profile.is_admin, false) end as author_is_admin,
  case when comment.is_anonymous then null else public_profile.username end as author_username
from public.agora_comments as comment
left join public.agora_public_profiles as public_profile
  on public_profile.profile_number = comment.profile_number
where comment.deleted_at is null;

alter view public.agora_comment_feed set (security_invoker = true);
revoke all privileges on table public.agora_comment_feed
  from public, anon, authenticated;

create or replace function public.get_agora_comment_feed(
  p_session_token text
)
returns setof public.agora_comment_feed
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  has_member_session boolean := false;
begin
  if nullif(btrim(p_session_token), '') is not null then
    perform public.require_agora_session(p_session_token);
    has_member_session := true;
  end if;

  return query
  select
    feed.id,
    feed.post_number,
    feed.parent_id,
    case when has_member_session then feed.profile_number else null::bigint end,
    case when has_member_session then feed.author_name else 'ANON'::text end,
    case when has_member_session then feed.avatar_index else null::smallint end,
    feed.body,
    feed.visible_character_count,
    feed.created_at,
    feed.likes_count,
    feed.dislikes_count,
    case when has_member_session then feed.is_anonymous else true end,
    case when has_member_session then feed.author_is_admin else false end,
    case when has_member_session then feed.author_username else null::text end
  from public.agora_comment_feed as feed
  order by feed.created_at desc;
end;
$$;

create or replace function public.get_agora_profile_by_username(
  p_username text,
  p_session_token text
)
returns table (
  profile_number bigint,
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
  normalized_username text := lower(regexp_replace(btrim(coalesce(p_username, '')), '^@+', ''));
begin
  current_profile_number := public.require_agora_session(p_session_token);

  if normalized_username !~ '^[a-z0-9_]{2,32}$' then
    return;
  end if;

  return query
  select
    profile.profile_number,
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
  where lower(profile.username) = normalized_username
  limit 1;
end;
$$;

revoke all on function public.get_agora_comment_feed(text) from public;
revoke all on function public.get_agora_profile_by_username(text, text) from public;

grant execute on function public.get_agora_comment_feed(text)
  to anon, authenticated;
grant execute on function public.get_agora_profile_by_username(text, text)
  to anon, authenticated;

commit;
