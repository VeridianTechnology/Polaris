-- Fix admin_create_agora_invite failing at runtime because the PL/pgSQL output
-- parameter `profile_number` conflicts with the identically named upsert column.
-- Targeting the existing unique constraint removes the ambiguous identifier.

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
  on conflict on constraint agora_user_invites_profile_number_key do update
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
