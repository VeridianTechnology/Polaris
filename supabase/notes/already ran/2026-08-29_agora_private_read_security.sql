-- Require a valid Agora application session before profiles can be read. Global
-- posts remain public, but their authorship is redacted unless the reader has a
-- valid Agora session. This also resolves the SECURITY DEFINER view lint.

begin;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_comments') is null
    or to_regclass('public.agora_profile_directory') is null
    or to_regclass('public.agora_comment_feed') is null then
    raise exception 'Run the Agora content, title-swap, and user-auth migrations first';
  end if;

  if to_regprocedure('public.require_agora_session(text)') is null then
    raise exception 'Run 2026-08-29_agora_user_auth_admin.sql first';
  end if;
end;
$$;

-- Views cannot own RLS policies. Make them honor the permissions/RLS context of
-- their invoker, then remove their public PostgREST read surface entirely.
alter view public.agora_profile_directory set (security_invoker = true);
alter view public.agora_comment_feed set (security_invoker = true);

revoke all privileges on table public.agora_profile_directory
  from public, anon, authenticated;
revoke all privileges on table public.agora_comment_feed
  from public, anon, authenticated;

-- Keep the source tables behind RLS as defense in depth. All browser reads and
-- writes go through narrowly scoped SECURITY DEFINER functions below/existing
-- Agora functions. Public feed reads receive only the anonymized projection.
alter table public.agora_public_profiles enable row level security;
alter table public.agora_comments enable row level security;

revoke all privileges on table public.agora_public_profiles
  from public, anon, authenticated;
revoke all privileges on table public.agora_comments
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
    case when has_member_session then feed.author_is_admin else false end
  from public.agora_comment_feed as feed
  order by feed.created_at desc;
end;
$$;

create or replace function public.get_agora_profile(
  p_profile_number bigint,
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
begin
  current_profile_number := public.require_agora_session(p_session_token);

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
  where profile.profile_number = p_profile_number;
end;
$$;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Remove that
-- inherited grant. The feed RPC intentionally accepts a missing token and emits
-- anonymous author metadata; the profile RPC always requires a valid session.
revoke all on function public.get_agora_comment_feed(text) from public;
revoke all on function public.get_agora_profile(bigint, text) from public;

grant execute on function public.get_agora_comment_feed(text)
  to anon, authenticated;
grant execute on function public.get_agora_profile(bigint, text)
  to anon, authenticated;

commit;
