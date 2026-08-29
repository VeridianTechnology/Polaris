-- Agora member login, administrator identity, session-authorized profile/post RPCs,
-- and server-side Global link limits.
--
-- Run once AFTER:
--   1. 2026-08-29_academy_numbered_profiles.sql
--   2. 2026-08-29_agora_academy_title_swap.sql

begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_comments') is null then
    raise exception 'Run the Agora/Academy title-swap migration before this authentication migration.';
  end if;
end;
$$;

alter table public.agora_public_profiles
  add column if not exists is_admin boolean not null default false;

update public.agora_public_profiles
set
  display_name = 'NYX',
  is_admin = true
where profile_number = 1;

create table if not exists public.agora_user_credentials (
  profile_number bigint primary key
    references public.agora_public_profiles(profile_number) on delete cascade,
  login_username text not null unique
    check (login_username ~ '^[A-Za-z0-9._-]{3,64}$'),
  password_hash text not null,
  failed_attempts smallint not null default 0
    check (failed_attempts between 0 and 5),
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agora_user_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_number bigint not null
    references public.agora_public_profiles(profile_number) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  constraint agora_user_sessions_expiry_check check (expires_at > created_at)
);

create index if not exists agora_user_sessions_profile_idx
  on public.agora_user_sessions (profile_number, expires_at desc);

create index if not exists agora_user_sessions_active_idx
  on public.agora_user_sessions (expires_at)
  where revoked_at is null;

-- Seed NYX's login. The password is stored only as a bcrypt hash in the database.
insert into public.agora_user_credentials (
  profile_number,
  login_username,
  password_hash
)
values (
  1,
  'nyx.super.user',
  '$2a$12$65fYcxcJNANeBK2WByFxhOA66biMvkxf6rkoOOHDWk4x/0V6LcFVS'
)
on conflict (profile_number) do update
set
  login_username = excluded.login_username,
  password_hash = excluded.password_hash,
  failed_attempts = 0,
  locked_until = null,
  updated_at = now();

create or replace function public.agora_session_profile(p_session_token text)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select stored.profile_number
  from public.agora_user_sessions as stored
  where stored.token_hash = extensions.digest(coalesce(p_session_token, ''), 'sha256')
    and stored.revoked_at is null
    and stored.expires_at > now()
  limit 1;
$$;

create or replace function public.require_agora_session(p_session_token text)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resolved_profile_number bigint;
begin
  resolved_profile_number := public.agora_session_profile(p_session_token);
  if resolved_profile_number is null then
    raise exception 'A valid Agora login is required';
  end if;
  return resolved_profile_number;
end;
$$;

create or replace function public.login_agora_user(
  p_username text,
  p_password text
)
returns table (
  session_token text,
  profile_number bigint,
  username text,
  display_name text,
  avatar_index smallint,
  is_admin boolean,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  credential public.agora_user_credentials%rowtype;
  profile public.agora_public_profiles%rowtype;
  plain_token text;
  session_expiry timestamptz := now() + interval '30 days';
  next_failed_attempts smallint;
begin
  if p_username is null or p_password is null
    or char_length(p_username) > 64 or char_length(p_password) > 200 then
    return;
  end if;

  select stored.*
  into credential
  from public.agora_user_credentials as stored
  where lower(stored.login_username) = lower(btrim(p_username))
  for update;

  if not found then
    return;
  end if;

  if credential.locked_until is not null and credential.locked_until > now() then
    return;
  end if;

  if extensions.crypt(p_password, credential.password_hash) <> credential.password_hash then
    next_failed_attempts := least(credential.failed_attempts + 1, 5);
    update public.agora_user_credentials as stored
    set
      failed_attempts = next_failed_attempts,
      locked_until = case
        when next_failed_attempts >= 5 then now() + interval '15 minutes'
        else null
      end,
      updated_at = now()
    where stored.profile_number = credential.profile_number;
    return;
  end if;

  update public.agora_user_credentials as stored
  set
    failed_attempts = 0,
    locked_until = null,
    last_login_at = now(),
    updated_at = now()
  where stored.profile_number = credential.profile_number;

  select stored.*
  into profile
  from public.agora_public_profiles as stored
  where stored.profile_number = credential.profile_number;

  plain_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.agora_user_sessions (
    profile_number,
    token_hash,
    expires_at
  )
  values (
    profile.profile_number,
    extensions.digest(plain_token, 'sha256'),
    session_expiry
  );

  delete from public.agora_user_sessions as stored
  where stored.expires_at <= now()
     or (stored.revoked_at is not null and stored.revoked_at < now() - interval '7 days');

  return query select
    plain_token,
    profile.profile_number,
    profile.username,
    profile.display_name,
    profile.avatar_index,
    profile.is_admin,
    session_expiry;
end;
$$;

create or replace function public.get_agora_user_session(p_session_token text)
returns table (
  profile_number bigint,
  username text,
  display_name text,
  avatar_index smallint,
  is_admin boolean,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.profile_number,
    profile.username,
    profile.display_name,
    profile.avatar_index,
    profile.is_admin,
    stored.expires_at
  from public.agora_user_sessions as stored
  join public.agora_public_profiles as profile
    on profile.profile_number = stored.profile_number
  where stored.token_hash = extensions.digest(coalesce(p_session_token, ''), 'sha256')
    and stored.revoked_at is null
    and stored.expires_at > now()
  limit 1;
$$;

create or replace function public.logout_agora_user(p_session_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  revoked_count integer;
begin
  update public.agora_user_sessions as stored
  set revoked_at = now()
  where stored.token_hash = extensions.digest(coalesce(p_session_token, ''), 'sha256')
    and stored.revoked_at is null;
  get diagnostics revoked_count = row_count;
  return revoked_count > 0;
end;
$$;

create or replace view public.agora_profile_directory as
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
  case when profile.email_is_public then profile.email else null end as email,
  profile.email_is_public,
  profile.created_at,
  profile.is_admin
from public.agora_public_profiles as profile;

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
  case when comment.is_anonymous then false else coalesce(public_profile.is_admin, false) end as author_is_admin
from public.agora_comments as comment
left join public.agora_public_profiles as public_profile
  on public_profile.profile_number = comment.profile_number
where comment.deleted_at is null;

create or replace function public.agora_post_link_count(p_body text)
returns integer
language sql
immutable
strict
set search_path = ''
as $$
  select count(*)::integer
  from regexp_matches(
    p_body,
    '((https?://|www\.)[^[:space:]<]+)',
    'gi'
  ) as matched(link_parts);
$$;

create or replace function public.agora_longest_post_link(p_body text)
returns integer
language sql
immutable
strict
set search_path = ''
as $$
  select coalesce(max(char_length(link_parts[1])), 0)::integer
  from regexp_matches(
    p_body,
    '((https?://|www\.)[^[:space:]<]+)',
    'gi'
  ) as matched(link_parts);
$$;

alter table public.agora_comments
  drop constraint if exists agora_comments_link_count_check,
  drop constraint if exists agora_comments_link_length_check;

alter table public.agora_comments
  add constraint agora_comments_link_count_check
    check (public.agora_post_link_count(body) <= 3),
  add constraint agora_comments_link_length_check
    check (public.agora_longest_post_link(body) <= 200);

create or replace function public.enforce_agora_global_post_cooldown()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  posting_profile_is_admin boolean;
begin
  select profile.is_admin
  into posting_profile_is_admin
  from public.agora_public_profiles as profile
  where profile.profile_number = new.profile_number;

  if coalesce(posting_profile_is_admin, false) then
    return new;
  end if;

  if new.parent_id is null and exists (
    select 1
    from public.agora_comments as recent_post
    where recent_post.profile_number = new.profile_number
      and recent_post.parent_id is null
      and recent_post.deleted_at is null
      and recent_post.created_at > now() - interval '24 hours'
  ) then
    raise exception 'Global posting is limited to once every 24 hours';
  end if;

  return new;
end;
$$;

create or replace function public.agora_post_status(p_session_token text)
returns table (
  can_post boolean,
  next_post_at timestamptz,
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
  profile_state public.agora_public_profiles%rowtype;
  latest_post_at timestamptz;
begin
  current_profile_number := public.require_agora_session(p_session_token);

  select profile.*
  into profile_state
  from public.agora_public_profiles as profile
  where profile.profile_number = current_profile_number;

  select max(comment.created_at)
  into latest_post_at
  from public.agora_comments as comment
  where comment.profile_number = current_profile_number
    and comment.parent_id is null
    and comment.deleted_at is null;

  return query select
    profile_state.is_admin
      or latest_post_at is null
      or latest_post_at <= now() - interval '24 hours',
    case
      when profile_state.is_admin or latest_post_at is null then null
      else latest_post_at + interval '24 hours'
    end,
    profile_state.anonymous_mode,
    true,
    profile_state.is_admin;
end;
$$;

create or replace function public.create_agora_post(
  p_body text,
  p_session_token text
)
returns setof public.agora_comment_feed
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_number bigint;
  current_profile public.agora_public_profiles%rowtype;
  new_comment_id bigint;
begin
  current_profile_number := public.require_agora_session(p_session_token);

  select profile.*
  into current_profile
  from public.agora_public_profiles as profile
  where profile.profile_number = current_profile_number;

  insert into public.agora_comments (
    user_id,
    guest_name,
    profile_number,
    body,
    is_anonymous,
    browser_author_id
  )
  values (
    current_profile.auth_user_id,
    current_profile.display_name,
    current_profile.profile_number,
    btrim(p_body),
    current_profile.anonymous_mode,
    null
  )
  returning id into new_comment_id;

  return query
  select feed.*
  from public.agora_comment_feed as feed
  where feed.id = new_comment_id;
end;
$$;

create or replace function public.delete_agora_post(
  p_post_number bigint,
  p_session_token text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_number bigint;
  deleted_count integer;
begin
  current_profile_number := public.require_agora_session(p_session_token);

  update public.agora_comments as comment
  set deleted_at = now()
  where comment.profile_number = current_profile_number
    and comment.post_number = p_post_number
    and comment.deleted_at is null;

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
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
language sql
stable
security definer
set search_path = ''
as $$
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
      when profile.profile_number = public.agora_session_profile(p_session_token) then profile.email
      when profile.email_is_public then profile.email
      else null
    end,
    profile.email_is_public,
    profile.anonymous_mode,
    profile.profile_number = public.agora_session_profile(p_session_token),
    profile.is_admin
  from public.agora_public_profiles as profile
  where profile.profile_number = p_profile_number;
$$;

create or replace function public.update_agora_profile(
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
  p_anonymous_mode boolean
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
    anonymous_mode = coalesce(p_anonymous_mode, false)
  where profile_number = current_profile_number;
end;
$$;

alter table public.agora_user_credentials enable row level security;
alter table public.agora_user_sessions enable row level security;

revoke all on table public.agora_user_credentials from public, anon, authenticated;
revoke all on table public.agora_user_sessions from public, anon, authenticated;

revoke all on function public.agora_session_profile(text) from public;
revoke all on function public.require_agora_session(text) from public;
revoke all on function public.login_agora_user(text, text) from public;
revoke all on function public.get_agora_user_session(text) from public;
revoke all on function public.logout_agora_user(text) from public;
revoke all on function public.agora_post_status(text) from public;
revoke all on function public.create_agora_post(text, text) from public;
revoke all on function public.delete_agora_post(bigint, text) from public;
revoke all on function public.get_agora_profile(bigint, text) from public;
revoke all on function public.update_agora_profile(
  text, text, smallint, text, text, text, text, text, text, boolean, boolean
) from public;

grant execute on function public.login_agora_user(text, text) to anon, authenticated;
grant execute on function public.get_agora_user_session(text) to anon, authenticated;
grant execute on function public.logout_agora_user(text) to anon, authenticated;
grant execute on function public.agora_post_status(text) to anon, authenticated;
grant execute on function public.create_agora_post(text, text) to anon, authenticated;
grant execute on function public.delete_agora_post(bigint, text) to anon, authenticated;
grant execute on function public.get_agora_profile(bigint, text) to anon, authenticated;
grant execute on function public.update_agora_profile(
  text, text, smallint, text, text, text, text, text, text, boolean, boolean
) to anon, authenticated;

-- Retire the visitor-ID write surface now that profile writes require a login.
revoke all on function public.create_nyx_agora_post(text, uuid) from anon, authenticated;
revoke all on function public.delete_nyx_agora_post(bigint, uuid) from anon, authenticated;
revoke all on function public.agora_nyx_post_status(uuid) from anon, authenticated;
revoke all on function public.get_nyx_agora_profile(uuid) from anon, authenticated;
revoke all on function public.update_nyx_agora_profile(
  uuid, text, smallint, text, text, text, text, text, text, boolean, boolean
) from anon, authenticated;

grant select on public.agora_comment_feed to anon, authenticated;
grant select on public.agora_profile_directory to anon, authenticated;

commit;
