-- Agora credential requirements, escalating member lockouts, and durable login state.
-- Prepared August 29, 2026.
--
-- Run once AFTER:
--   1. 2026-08-29_agora_user_auth_admin.sql
--   2. 2026-08-29_agora_invite_claim_onboarding.sql
--
-- Passwords require 8-128 characters and at least one symbol. PINs contain
-- exactly four digits. Secrets remain bcrypt hashes; this migration stores no
-- plaintext credentials.

begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_user_credentials') is null
    or to_regclass('public.agora_user_sessions') is null
    or to_regclass('public.agora_user_invites') is null
    or to_regclass('public.agora_managed_users') is null then
    raise exception 'Run the Agora authentication and invitation migrations first.';
  end if;
end;
$$;

alter table public.agora_user_credentials
  add column if not exists lockout_level smallint,
  add column if not exists permanently_locked boolean;

update public.agora_user_credentials
set
  lockout_level = case
    when locked_until is not null and locked_until > now() then 1
    else 0
  end,
  permanently_locked = false
where lockout_level is null
   or permanently_locked is null;

alter table public.agora_user_credentials
  alter column lockout_level set default 0,
  alter column lockout_level set not null,
  alter column permanently_locked set default false,
  alter column permanently_locked set not null,
  drop constraint if exists agora_user_credentials_lockout_level_check;

alter table public.agora_user_credentials
  add constraint agora_user_credentials_lockout_level_check
  check (lockout_level between 0 and 3);

comment on column public.agora_user_credentials.lockout_level is
  '0 = initial attempts, 1 = first 24-hour lock served, 2 = seven-day lock served, 3 = permanent lock';
comment on column public.agora_user_credentials.permanently_locked is
  'Prevents all future login attempts until a future administrator unlock action explicitly resets it';

alter table public.agora_managed_users
  add column if not exists has_logged_in boolean;

update public.agora_managed_users as managed
set has_logged_in = exists (
  select 1
  from public.agora_user_credentials as credential
  where credential.profile_number = managed.profile_number
    and credential.last_login_at is not null
)
or exists (
  select 1
  from public.agora_user_invites as invitation
  where invitation.profile_number = managed.profile_number
    and invitation.claimed_at is not null
)
or exists (
  select 1
  from public.agora_user_sessions as session
  where session.profile_number = managed.profile_number
)
or managed.profile_number = 1
where managed.has_logged_in is null;

alter table public.agora_managed_users
  alter column has_logged_in set default false,
  alter column has_logged_in set not null;

comment on column public.agora_managed_users.has_logged_in is
  'Durable has-ever-logged-in marker for future 30-day unclaimed-account cleanup; current login state is derived from active sessions';

-- Atomically consumes a valid invitation, validates the new credential rules,
-- records the first login, and creates the first 30-day application session.
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
    if char_length(coalesce(p_secret, '')) < 8
      or char_length(p_secret) > 128
      or coalesce(p_secret, '') !~ '[^[:alnum:][:space:]]' then
      raise exception 'Password must contain 8-128 characters and at least one symbol';
    end if;
  elsif normalized_kind = 'pin' then
    if coalesce(p_secret, '') !~ '^[0-9]{4}$' then
      raise exception 'PIN must contain exactly 4 digits';
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

  update public.agora_managed_users as managed
  set
    has_logged_in = true,
    updated_at = now()
  where managed.profile_number = profile.profile_number;

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

-- Credential-aware retry ladder:
--   password: five misses -> 24 hours -> next miss -> seven days -> next miss -> permanent
--   PIN:      three misses -> 24 hours -> next miss -> seven days -> next miss -> permanent
-- A successful login before permanent lock resets the complete ladder.
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
  attempt_limit smallint;
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

  if credential.permanently_locked
    or (credential.locked_until is not null and credential.locked_until > now()) then
    return;
  end if;

  if extensions.crypt(p_password, credential.password_hash) <> credential.password_hash then
    if credential.lockout_level >= 2 then
      update public.agora_user_credentials as stored
      set
        failed_attempts = least(stored.failed_attempts + 1, 5),
        lockout_level = 3,
        locked_until = null,
        permanently_locked = true,
        updated_at = now()
      where stored.profile_number = credential.profile_number;

      update public.agora_user_sessions as stored
      set revoked_at = coalesce(stored.revoked_at, now())
      where stored.profile_number = credential.profile_number
        and stored.revoked_at is null;
    elsif credential.lockout_level = 1 then
      update public.agora_user_credentials as stored
      set
        failed_attempts = least(stored.failed_attempts + 1, 5),
        lockout_level = 2,
        locked_until = now() + interval '7 days',
        updated_at = now()
      where stored.profile_number = credential.profile_number;
    else
      attempt_limit := case when credential.credential_kind = 'pin' then 3 else 5 end;
      next_failed_attempts := least(credential.failed_attempts + 1, 5);

      update public.agora_user_credentials as stored
      set
        failed_attempts = next_failed_attempts,
        lockout_level = case
          when next_failed_attempts >= attempt_limit then 1
          else 0
        end,
        locked_until = case
          when next_failed_attempts >= attempt_limit then now() + interval '24 hours'
          else null
        end,
        updated_at = now()
      where stored.profile_number = credential.profile_number;
    end if;
    return;
  end if;

  update public.agora_user_credentials as stored
  set
    failed_attempts = 0,
    lockout_level = 0,
    locked_until = null,
    last_login_at = now(),
    updated_at = now()
  where stored.profile_number = credential.profile_number;

  update public.agora_managed_users as managed
  set
    has_logged_in = true,
    updated_at = now()
  where managed.profile_number = credential.profile_number;

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

revoke all on function public.claim_agora_invite(text, text, text, text) from public;
revoke all on function public.login_agora_user(text, text) from public;
grant execute on function public.claim_agora_invite(text, text, text, text) to anon, authenticated;
grant execute on function public.login_agora_user(text, text) to anon, authenticated;

commit;
