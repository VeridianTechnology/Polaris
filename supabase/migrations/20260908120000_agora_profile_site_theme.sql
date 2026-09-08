-- Add a member-level site color preference and expose it through the existing
-- session-authorized profile RPCs.

begin;

alter table public.agora_public_profiles
  add column if not exists site_theme text not null default 'soft-white';

alter table public.agora_public_profiles
  drop constraint if exists agora_public_profiles_site_theme_check,
  add constraint agora_public_profiles_site_theme_check
    check (site_theme in ('soft-white', 'pale-blue'));

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
  site_theme text,
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
    profile.site_theme,
    profile.profile_number = current_profile_number,
    profile.is_admin
  from public.agora_public_profiles as profile
  where profile.profile_number = p_profile_number;
end;
$$;

drop function if exists public.get_agora_profile_by_username(text, text);
create function public.get_agora_profile_by_username(
  p_username text,
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
  site_theme text,
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
    profile.site_theme,
    profile.profile_number = current_profile_number,
    profile.is_admin
  from public.agora_public_profiles as profile
  where lower(profile.username) = normalized_username
  limit 1;
end;
$$;

drop function if exists public.update_agora_profile(
  text, text, smallint, text, text, text, text, text, text, boolean, boolean
);
create function public.update_agora_profile(
  p_session_token text,
  p_display_name text,
  p_avatar_index smallint,
  p_bio text,
  p_twitter_url text,
  p_instagram_url text,
  p_facebook_url text,
  p_snapchat_url text,
  p_email text,
  p_email_is_public boolean,
  p_anonymous_mode boolean,
  p_site_theme text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_number bigint;
begin
  current_profile_number := public.require_agora_session(p_session_token);

  update public.agora_public_profiles
  set
    display_name = left(btrim(p_display_name), 80),
    avatar_index = p_avatar_index,
    bio = coalesce(p_bio, ''),
    twitter_url = nullif(btrim(p_twitter_url), ''),
    instagram_url = nullif(btrim(p_instagram_url), ''),
    facebook_url = nullif(btrim(p_facebook_url), ''),
    snapchat_url = nullif(btrim(p_snapchat_url), ''),
    email = nullif(btrim(p_email), ''),
    email_is_public = coalesce(p_email_is_public, false),
    anonymous_mode = coalesce(p_anonymous_mode, false),
    site_theme = case
      when p_site_theme in ('soft-white', 'pale-blue') then p_site_theme
      else 'soft-white'
    end
  where profile_number = current_profile_number;
end;
$$;

revoke all on function public.get_agora_profile(bigint, text) from public;
revoke all on function public.get_agora_profile_by_username(text, text) from public;
revoke all on function public.update_agora_profile(
  text, text, smallint, text, text, text, text, text, text, boolean, boolean, text
) from public;

grant execute on function public.get_agora_profile(bigint, text) to anon, authenticated;
grant execute on function public.get_agora_profile_by_username(text, text) to anon, authenticated;
grant execute on function public.update_agora_profile(
  text, text, smallint, text, text, text, text, text, text, boolean, boolean, text
) to anon, authenticated;

commit;
