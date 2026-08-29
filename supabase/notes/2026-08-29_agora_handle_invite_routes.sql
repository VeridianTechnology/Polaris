-- Enable one-time invitation onboarding from a top-level Twitter-handle path,
-- for example https://soft-fenglisu-ae6931.netlify.app/TotenEdelweiss.
--
-- A handle-only URL is intentionally easier to guess than the original opaque
-- token URL. The existing expiry, revocation, claim, credential, managed-user,
-- and row-lock protections remain in force.

create or replace function public.inspect_agora_handle_invite(p_username text)
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
  if normalized_username !~ '^[a-z0-9_]{2,32}$' then
    return;
  end if;

  select stored.*
  into profile
  from public.agora_public_profiles as stored
  where lower(stored.username) = normalized_username
  limit 1;

  if not found then
    return;
  end if;

  select stored.*
  into invitation
  from public.agora_user_invites as stored
  where stored.profile_number = profile.profile_number
  limit 1;

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

create or replace function public.claim_agora_handle_invite(
  p_username text,
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
  if normalized_username !~ '^[a-z0-9_]{2,32}$' then
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
  into profile
  from public.agora_public_profiles as stored
  where lower(stored.username) = normalized_username
  limit 1;

  if not found then
    raise exception 'This invitation is invalid';
  end if;

  select stored.*
  into invitation
  from public.agora_user_invites as stored
  where stored.profile_number = profile.profile_number
  for update;

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

revoke all on function public.inspect_agora_handle_invite(text)
  from public, anon, authenticated;
revoke all on function public.claim_agora_handle_invite(text, text, text)
  from public, anon, authenticated;

grant execute on function public.inspect_agora_handle_invite(text)
  to anon, authenticated;
grant execute on function public.claim_agora_handle_invite(text, text, text)
  to anon, authenticated;
