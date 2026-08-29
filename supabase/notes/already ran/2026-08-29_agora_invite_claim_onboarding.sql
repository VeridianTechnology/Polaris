-- Agora one-time invitations, self-selected credentials, and public user count.
-- Prepared August 29, 2026.
--
-- Run once AFTER:
--   1. 2026-08-29_agora_academy_title_swap.sql
--   2. 2026-08-29_agora_user_auth_admin.sql
--   3. 2026-08-29_agora_private_read_security.sql
--
-- This migration does not store invitation tokens or member secrets in plaintext.
-- The administrator receives the invitation token once. Only its SHA-256 digest is
-- persisted. The member's password or six-digit PIN is persisted only as bcrypt.

begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_user_credentials') is null
    or to_regclass('public.agora_user_sessions') is null
    or to_regclass('public.agora_managed_users') is null
    or to_regclass('public.profiles') is null then
    raise exception 'Run the Agora title-swap and user-auth migrations before this invitation migration.';
  end if;
end;
$$;

-- The original Supabase Auth compatibility profile must not remain as an
-- alternate anonymous profile directory after Agora profiles were made private.
alter table public.profiles enable row level security;
drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
revoke all privileges on table public.profiles
  from public, anon, authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

-- New invitations use Agora's profile number as their canonical identity. The
-- auth_user_id column remains for legacy rows created through Supabase Auth.
alter table public.agora_managed_users
  alter column auth_user_id drop not null,
  add column if not exists profile_number bigint
    references public.agora_public_profiles(profile_number) on delete cascade;

update public.agora_managed_users as managed
set profile_number = profile.profile_number
from public.agora_public_profiles as profile
where managed.profile_number is null
  and managed.auth_user_id = profile.auth_user_id;

create unique index if not exists agora_managed_users_profile_number_key
  on public.agora_managed_users (profile_number)
  where profile_number is not null;

alter table public.agora_user_credentials
  add column if not exists credential_kind text;

update public.agora_user_credentials
set credential_kind = 'password'
where credential_kind is null;

alter table public.agora_user_credentials
  alter column credential_kind set default 'password',
  alter column credential_kind set not null,
  drop constraint if exists agora_user_credentials_kind_check;

alter table public.agora_user_credentials
  add constraint agora_user_credentials_kind_check
  check (credential_kind in ('password', 'pin'));

create table if not exists public.agora_user_invites (
  id uuid primary key default gen_random_uuid(),
  profile_number bigint not null unique
    references public.agora_public_profiles(profile_number) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  first_opened_at timestamptz,
  claimed_at timestamptz,
  revoked_at timestamptz,
  constraint agora_user_invites_expiry_check check (expires_at > created_at),
  constraint agora_user_invites_claim_order_check
    check (claimed_at is null or claimed_at >= created_at),
  constraint agora_user_invites_open_order_check
    check (first_opened_at is null or first_opened_at >= created_at)
);

create index if not exists agora_user_invites_active_idx
  on public.agora_user_invites (expires_at)
  where claimed_at is null and revoked_at is null;

drop trigger if exists agora_user_invites_set_updated_at
  on public.agora_user_invites;
create trigger agora_user_invites_set_updated_at
before update on public.agora_user_invites
for each row execute function public.set_updated_at();

alter table public.agora_user_invites enable row level security;
revoke all privileges on table public.agora_user_invites
  from public, anon, authenticated;
grant select, update on table public.agora_user_invites to service_role;
grant select on table public.agora_public_profiles to service_role;
grant update on table public.agora_user_sessions to service_role;

-- Called only by the server-side admin Edge Function. Reissuing an unclaimed
-- handle rotates the token and invalidates the previously generated link.
create or replace function public.admin_create_agora_invite(p_handle text)
returns table (
  profile_number bigint,
  twitter_handle text,
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_handle text := regexp_replace(btrim(coalesce(p_handle, '')), '^@+', '');
  normalized_username text;
  selected_profile_number bigint;
  selected_managed_id bigint;
  plain_token text;
  invitation_expiry timestamptz := now() + interval '30 days';
begin
  if normalized_handle !~ '^[A-Za-z0-9_]{2,32}$' then
    raise exception 'Twitter handle must contain 2-32 letters, numbers, or underscores';
  end if;

  normalized_username := lower(normalized_handle);

  select managed.profile_number, managed.id
  into selected_profile_number, selected_managed_id
  from public.agora_managed_users as managed
  where lower(managed.twitter_handle) = normalized_username
  limit 1;

  if selected_profile_number is null then
    select profile.profile_number
    into selected_profile_number
    from public.agora_public_profiles as profile
    where lower(profile.username) = normalized_username
    limit 1;
  end if;

  if selected_profile_number is null then
    insert into public.agora_public_profiles (
      username,
      display_name,
      avatar_index,
      twitter_url
    )
    values (
      normalized_username,
      '@' || normalized_handle,
      0,
      'https://x.com/' || normalized_handle
    )
    returning agora_public_profiles.profile_number
    into selected_profile_number;
  end if;

  if exists (
    select 1
    from public.agora_user_credentials as credential
    where credential.profile_number = selected_profile_number
  ) then
    raise exception 'This Agora user has already selected a credential';
  end if;

  if exists (
    select 1
    from public.agora_public_profiles as profile
    where lower(profile.username) = normalized_username
      and profile.profile_number <> selected_profile_number
  ) then
    raise exception 'This Twitter handle is already assigned to another Agora profile';
  end if;

  -- Older managed rows used an internal member_* username. Before an unclaimed
  -- legacy profile receives its invitation, make the handle its actual login.
  update public.agora_public_profiles as profile
  set
    username = normalized_username,
    display_name = '@' || normalized_handle,
    twitter_url = 'https://x.com/' || normalized_handle
  where profile.profile_number = selected_profile_number;

  if selected_managed_id is null then
    insert into public.agora_managed_users (
      profile_number,
      twitter_handle,
      twitter_url,
      status
    )
    values (
      selected_profile_number,
      normalized_handle,
      'https://x.com/' || normalized_handle,
      'active'
    )
    returning id into selected_managed_id;
  else
    update public.agora_managed_users as managed
    set
      profile_number = selected_profile_number,
      twitter_handle = normalized_handle,
      twitter_url = 'https://x.com/' || normalized_handle,
      status = 'active'
    where managed.id = selected_managed_id;
  end if;

  plain_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.agora_user_invites (
    profile_number,
    token_hash,
    expires_at
  )
  values (
    selected_profile_number,
    extensions.digest(plain_token, 'sha256'),
    invitation_expiry
  )
  on conflict (profile_number) do update
  set
    token_hash = excluded.token_hash,
    created_at = now(),
    updated_at = now(),
    expires_at = excluded.expires_at,
    first_opened_at = null,
    claimed_at = null,
    revoked_at = null;

  return query select
    selected_profile_number,
    normalized_handle,
    plain_token,
    invitation_expiry;
end;
$$;

-- Validates an invitation without exposing any profile for a guessed handle.
-- A valid first open is recorded, but it does not consume the invitation.
create or replace function public.inspect_agora_invite(
  p_username text,
  p_invite_token text
)
returns table (
  profile_number bigint,
  username text,
  display_name text,
  invite_state text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.agora_user_invites%rowtype;
  profile public.agora_public_profiles%rowtype;
  normalized_username text := lower(regexp_replace(btrim(coalesce(p_username, '')), '^@+', ''));
  resolved_state text;
begin
  if char_length(coalesce(p_invite_token, '')) <> 64
    or normalized_username !~ '^[a-z0-9_]{2,32}$' then
    return;
  end if;

  select stored.*
  into invitation
  from public.agora_user_invites as stored
  where stored.token_hash = extensions.digest(p_invite_token, 'sha256')
  limit 1;

  if not found then
    return;
  end if;

  select stored.*
  into profile
  from public.agora_public_profiles as stored
  where stored.profile_number = invitation.profile_number
    and lower(stored.username) = normalized_username;

  if not found then
    return;
  end if;

  resolved_state := case
    when invitation.revoked_at is not null then 'revoked'
    when invitation.claimed_at is not null then 'claimed'
    when invitation.expires_at <= now() then 'expired'
    else 'ready'
  end;

  if resolved_state = 'ready' and invitation.first_opened_at is null then
    update public.agora_user_invites as stored
    set first_opened_at = now()
    where stored.id = invitation.id;
  end if;

  return query select
    profile.profile_number,
    profile.username,
    profile.display_name,
    resolved_state,
    invitation.expires_at;
end;
$$;

-- Atomically consumes a valid invitation, creates the member-selected bcrypt
-- credential, and returns a normal 30-day Agora application session.
create or replace function public.claim_agora_invite(
  p_username text,
  p_invite_token text,
  p_credential_kind text,
  p_secret text
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
  invitation public.agora_user_invites%rowtype;
  profile public.agora_public_profiles%rowtype;
  normalized_username text := lower(regexp_replace(btrim(coalesce(p_username, '')), '^@+', ''));
  normalized_kind text := lower(btrim(coalesce(p_credential_kind, '')));
  plain_token text;
  session_expiry timestamptz := now() + interval '30 days';
begin
  if char_length(coalesce(p_invite_token, '')) <> 64
    or normalized_username !~ '^[a-z0-9_]{2,32}$' then
    raise exception 'This invitation is invalid';
  end if;

  if normalized_kind = 'password' then
    if char_length(coalesce(p_secret, '')) < 12
      or char_length(p_secret) > 128
      or char_length(btrim(p_secret)) = 0 then
      raise exception 'Password must contain 12-128 characters';
    end if;
  elsif normalized_kind = 'pin' then
    if coalesce(p_secret, '') !~ '^[0-9]{6}$' then
      raise exception 'PIN must contain exactly 6 digits';
    end if;
  else
    raise exception 'Select either a password or PIN';
  end if;

  select stored.*
  into invitation
  from public.agora_user_invites as stored
  where stored.token_hash = extensions.digest(p_invite_token, 'sha256')
  for update;

  if not found then
    raise exception 'This invitation is invalid';
  end if;

  select stored.*
  into profile
  from public.agora_public_profiles as stored
  where stored.profile_number = invitation.profile_number
    and lower(stored.username) = normalized_username;

  if not found then
    raise exception 'This invitation is invalid';
  end if;

  if invitation.revoked_at is not null then
    raise exception 'This invitation has been revoked';
  elsif invitation.claimed_at is not null then
    raise exception 'This invitation has already been claimed';
  elsif invitation.expires_at <= now() then
    raise exception 'This invitation has expired';
  end if;

  if exists (
    select 1
    from public.agora_user_credentials as credential
    where credential.profile_number = profile.profile_number
  ) then
    raise exception 'This Agora user has already selected a credential';
  end if;

  if exists (
    select 1
    from public.agora_managed_users as managed
    where managed.profile_number = profile.profile_number
      and managed.status <> 'active'
  ) then
    raise exception 'This Agora user is disabled';
  end if;

  insert into public.agora_user_credentials (
    profile_number,
    login_username,
    password_hash,
    credential_kind
  )
  values (
    profile.profile_number,
    profile.username,
    extensions.crypt(p_secret, extensions.gen_salt('bf', 12)),
    normalized_kind
  );

  update public.agora_user_invites as stored
  set
    first_opened_at = coalesce(stored.first_opened_at, now()),
    claimed_at = now()
  where stored.id = invitation.id;

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

-- The number is intentionally public, but no profile row is exposed.
create or replace function public.get_agora_user_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.agora_public_profiles;
$$;

-- Preserve the existing login signature while honoring the admin user's status
-- switch for accounts managed by the invitation dashboard.
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

  if exists (
    select 1
    from public.agora_managed_users as managed
    where managed.profile_number = credential.profile_number
      and managed.status <> 'active'
  ) then
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

-- PostgreSQL grants function execution to PUBLIC by default. Keep the privileged
-- creation surface server-only and expose only the three narrow browser RPCs.
revoke all on function public.admin_create_agora_invite(text)
  from public, anon, authenticated;
revoke all on function public.inspect_agora_invite(text, text)
  from public, anon, authenticated;
revoke all on function public.claim_agora_invite(text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.get_agora_user_count()
  from public, anon, authenticated;

grant execute on function public.admin_create_agora_invite(text)
  to service_role;
grant execute on function public.inspect_agora_invite(text, text)
  to anon, authenticated;
grant execute on function public.claim_agora_invite(text, text, text, text)
  to anon, authenticated;
grant execute on function public.get_agora_user_count()
  to anon, authenticated;

-- The replacement login function keeps its earlier browser grants.
revoke all on function public.login_agora_user(text, text) from public;
grant execute on function public.login_agora_user(text, text)
  to anon, authenticated;

commit;
