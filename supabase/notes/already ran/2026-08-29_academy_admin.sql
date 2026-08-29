-- Academy administration, IP lockouts, short-lived sessions, and managed users.
-- Apply after academy_schema.sql.
--
-- A locked address can be restored directly in the Supabase SQL Editor:
-- update public.academy_admin_ip_access
-- set is_enabled = true, failed_attempts = 0, window_started_at = null, locked_at = null
-- where ip_address = '203.0.113.10';

begin;

create table if not exists public.academy_admin_ip_access (
  ip_address inet primary key,
  failed_attempts smallint not null default 0
    check (failed_attempts between 0 and 5),
  window_started_at timestamptz,
  is_enabled boolean not null default true,
  locked_at timestamptz,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_admin_sessions (
  token_hash text primary key,
  ip_address inet not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists academy_admin_sessions_expires_at_idx
  on public.academy_admin_sessions (expires_at);

create table if not exists public.academy_managed_users (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  twitter_handle text not null
    check (twitter_handle ~ '^[A-Za-z0-9_]{1,32}$'),
  twitter_url text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists academy_managed_users_handle_idx
  on public.academy_managed_users (lower(twitter_handle));

alter table public.academy_admin_ip_access enable row level security;
alter table public.academy_admin_sessions enable row level security;
alter table public.academy_managed_users enable row level security;

drop trigger if exists academy_admin_ip_access_set_updated_at
  on public.academy_admin_ip_access;
create trigger academy_admin_ip_access_set_updated_at
before update on public.academy_admin_ip_access
for each row execute function public.set_updated_at();

drop trigger if exists academy_managed_users_set_updated_at
  on public.academy_managed_users;
create trigger academy_managed_users_set_updated_at
before update on public.academy_managed_users
for each row execute function public.set_updated_at();

create or replace function public.record_academy_admin_attempt(
  p_ip_address inet,
  p_succeeded boolean
)
returns table (
  allowed boolean,
  locked boolean,
  attempts_remaining smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_row public.academy_admin_ip_access%rowtype;
  next_failed_attempts smallint;
  next_window_started_at timestamptz;
begin
  if p_ip_address is null then
    raise exception 'An IP address is required';
  end if;

  insert into public.academy_admin_ip_access (ip_address)
  values (p_ip_address)
  on conflict (ip_address) do nothing;

  select access.*
  into access_row
  from public.academy_admin_ip_access as access
  where access.ip_address = p_ip_address
  for update;

  if not access_row.is_enabled then
    return query select false, true, 0::smallint;
    return;
  end if;

  if p_succeeded then
    update public.academy_admin_ip_access as access
    set
      failed_attempts = 0,
      window_started_at = null,
      locked_at = null,
      last_attempt_at = now()
    where access.ip_address = p_ip_address;

    return query select true, false, 5::smallint;
    return;
  end if;

  if access_row.window_started_at is null
    or access_row.window_started_at < now() - interval '1 minute' then
    next_failed_attempts := 1;
    next_window_started_at := now();
  else
    next_failed_attempts := least(access_row.failed_attempts + 1, 5);
    next_window_started_at := access_row.window_started_at;
  end if;

  update public.academy_admin_ip_access as access
  set
    failed_attempts = next_failed_attempts,
    window_started_at = next_window_started_at,
    is_enabled = next_failed_attempts < 5,
    locked_at = case when next_failed_attempts >= 5 then now() else null end,
    last_attempt_at = now()
  where access.ip_address = p_ip_address;

  return query select
    false,
    next_failed_attempts >= 5,
    greatest(5 - next_failed_attempts, 0)::smallint;
end;
$$;

revoke all on table public.academy_admin_ip_access from anon, authenticated;
revoke all on table public.academy_admin_sessions from anon, authenticated;
revoke all on table public.academy_managed_users from anon, authenticated;
revoke all on sequence public.academy_managed_users_id_seq from anon, authenticated;
revoke all on function public.record_academy_admin_attempt(inet, boolean) from public;
grant execute on function public.record_academy_admin_attempt(inet, boolean)
  to service_role;

commit;
