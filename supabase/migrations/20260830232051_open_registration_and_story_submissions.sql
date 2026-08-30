-- Migration: open Agora registration and moderated Academy story submissions.
--
-- This retires invitation-only browser onboarding and the public membership-count
-- RPCs without deleting historical invitation records. The ordinary Agora session
-- remains the only browser credential. NYX's existing is_admin flag authorizes the
-- separate server-side review queue.
--
-- Run after 20260830042943_agora_registered_membership_stats.sql.

begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regclass('public.agora_public_profiles') is null
    or to_regclass('public.agora_user_credentials') is null
    or to_regclass('public.agora_user_sessions') is null then
    raise exception 'Run the Agora user-auth migrations before open registration';
  end if;
end;
$$;

-- Anyone may create a normal Agora account. Passwords and PINs are bcrypt-hashed;
-- only the opaque 30-day application session is returned to the browser.
create or replace function public.register_agora_user(
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
  normalized_username text := lower(regexp_replace(btrim(coalesce(p_username, '')), '^@+', ''));
  normalized_kind text := lower(btrim(coalesce(p_credential_kind, '')));
  created_profile public.agora_public_profiles%rowtype;
  plain_token text;
  session_expiry timestamptz := now() + interval '30 days';
begin
  if normalized_username !~ '^[a-z0-9_]{3,32}$' then
    raise exception 'Username must contain 3-32 letters, numbers, or underscores';
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

  -- Reuse an uncredentialed profile left by the retired invitation system so its
  -- username is not stranded. In open membership the chosen username itself is
  -- public and does not assert ownership of a social-media identity.
  select profile.*
  into created_profile
  from public.agora_public_profiles as profile
  where lower(profile.username) = normalized_username
  for update;

  if exists (
    select 1
    from public.agora_user_credentials as credential
    where lower(credential.login_username) = normalized_username
      or credential.profile_number = created_profile.profile_number
  ) then
    raise exception 'That username is already registered';
  end if;

  if created_profile.profile_number is null then
    insert into public.agora_public_profiles (
      username,
      display_name,
      avatar_index
    )
    values (
      normalized_username,
      '@' || normalized_username,
      0
    )
    returning * into created_profile;
  end if;

  insert into public.agora_user_credentials (
    profile_number,
    login_username,
    password_hash,
    credential_kind
  )
  values (
    created_profile.profile_number,
    normalized_username,
    extensions.crypt(p_secret, extensions.gen_salt('bf', 12)),
    normalized_kind
  );

  update public.agora_managed_users as managed
  set
    has_logged_in = true,
    status = 'active',
    updated_at = now()
  where managed.profile_number = created_profile.profile_number;

  plain_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.agora_user_sessions (
    profile_number,
    token_hash,
    expires_at
  )
  values (
    created_profile.profile_number,
    extensions.digest(plain_token, 'sha256'),
    session_expiry
  );

  return query select
    plain_token,
    created_profile.profile_number,
    created_profile.username,
    created_profile.display_name,
    created_profile.avatar_index,
    created_profile.is_admin,
    session_expiry;
exception
  when unique_violation then
    raise exception 'That username is already registered';
end;
$$;

create table if not exists public.academy_story_submissions (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('finance', 'crime', 'freedom')),
  source_url text not null
    check (char_length(source_url) between 8 and 2000 and source_url ~* '^https?://[^[:space:]]+$'),
  image_url text not null
    check (char_length(image_url) between 8 and 2000 and image_url ~* '^https?://[^[:space:]]+$'),
  title text not null
    check (char_length(btrim(title)) between 3 and 160),
  subtitle text not null
    check (char_length(btrim(subtitle)) between 1 and 1200),
  submitter_profile_number bigint not null
    references public.agora_public_profiles(profile_number) on delete restrict,
  submitter_username text not null
    check (submitter_username ~ '^[a-z0-9_]{2,32}$'),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_profile_number bigint
    references public.agora_public_profiles(profile_number) on delete set null,
  review_note text
    check (review_note is null or char_length(review_note) <= 500),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_story_submissions_review_queue_idx
  on public.academy_story_submissions (status, created_at);
create index if not exists academy_story_submissions_public_idx
  on public.academy_story_submissions (category, reviewed_at desc)
  where status = 'approved';
create index if not exists academy_story_submissions_submitter_idx
  on public.academy_story_submissions (submitter_profile_number, created_at desc);

drop trigger if exists academy_story_submissions_set_updated_at
  on public.academy_story_submissions;
create trigger academy_story_submissions_set_updated_at
before update on public.academy_story_submissions
for each row execute function public.set_updated_at();

alter table public.academy_story_submissions enable row level security;
revoke all privileges on table public.academy_story_submissions
  from public, anon, authenticated;
grant select, insert, update, delete on table public.academy_story_submissions
  to service_role;

create or replace function public.submit_academy_story(
  p_session_token text,
  p_category text,
  p_source_url text,
  p_image_url text,
  p_title text,
  p_subtitle text
)
returns table (
  submission_id uuid,
  submission_status text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_number bigint;
  current_username text;
  normalized_category text := lower(btrim(coalesce(p_category, '')));
  created_submission public.academy_story_submissions%rowtype;
begin
  current_profile_number := public.require_agora_session(p_session_token);

  select profile.username
  into current_username
  from public.agora_public_profiles as profile
  where profile.profile_number = current_profile_number;

  if normalized_category not in ('finance', 'crime', 'freedom') then
    raise exception 'Select Finance, Crime, or Freedom';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 3 and 160 then
    raise exception 'Title must contain 3-160 characters';
  end if;
  if char_length(btrim(coalesce(p_subtitle, ''))) not between 1 and 1200 then
    raise exception 'Subtext must contain 1-1200 characters';
  end if;
  if char_length(btrim(coalesce(p_source_url, ''))) not between 8 and 2000
    or btrim(p_source_url) !~* '^https?://[^[:space:]]+$' then
    raise exception 'Story URL must be a valid http or https URL';
  end if;
  if char_length(btrim(coalesce(p_image_url, ''))) not between 8 and 2000
    or btrim(p_image_url) !~* '^https?://[^[:space:]]+$' then
    raise exception 'Image URL must be a valid http or https URL';
  end if;

  insert into public.academy_story_submissions (
    category,
    source_url,
    image_url,
    title,
    subtitle,
    submitter_profile_number,
    submitter_username
  )
  values (
    normalized_category,
    btrim(p_source_url),
    btrim(p_image_url),
    btrim(p_title),
    btrim(p_subtitle),
    current_profile_number,
    current_username
  )
  returning * into created_submission;

  return query select
    created_submission.id,
    created_submission.status,
    created_submission.created_at;
end;
$$;

create or replace function public.get_approved_academy_stories(p_category text)
returns table (
  id uuid,
  category text,
  source_url text,
  image_url text,
  title text,
  subtitle text,
  submitter_username text,
  approved_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    submission.id,
    submission.category,
    submission.source_url,
    submission.image_url,
    submission.title,
    submission.subtitle,
    submission.submitter_username,
    submission.reviewed_at
  from public.academy_story_submissions as submission
  where submission.status = 'approved'
    and submission.category = lower(btrim(coalesce(p_category, '')))
  order by submission.reviewed_at desc nulls last, submission.created_at desc;
$$;

-- Public invitation onboarding is retired. Historical rows remain intact so no
-- user or audit data is destroyed.
revoke all on function public.inspect_agora_invite(text, text)
  from public, anon, authenticated;
revoke all on function public.claim_agora_invite(text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.inspect_agora_handle_invite(text)
  from public, anon, authenticated;
revoke all on function public.claim_agora_handle_invite(text, text, text)
  from public, anon, authenticated;

drop function if exists public.get_agora_membership_stats();
drop function if exists public.get_agora_user_count();

revoke all on function public.register_agora_user(text, text, text)
  from public, anon, authenticated;
revoke all on function public.submit_academy_story(text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.get_approved_academy_stories(text)
  from public, anon, authenticated;

grant execute on function public.register_agora_user(text, text, text)
  to anon, authenticated;
grant execute on function public.submit_academy_story(text, text, text, text, text, text)
  to anon, authenticated;
grant execute on function public.get_approved_academy_stories(text)
  to anon, authenticated;
grant execute on function public.get_agora_user_session(text)
  to service_role;

commit;
