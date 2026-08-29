-- Academy database schema for Supabase
-- Paste this entire file into the Supabase SQL Editor and run it once.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,32}$'),
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 80),
  avatar_index smallint not null default 0
    check (avatar_index between 0 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_comments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id bigint references public.academy_comments(id) on delete cascade,
  body text not null
    check (char_length(btrim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists academy_comments_created_at_idx
  on public.academy_comments (created_at desc);

create index if not exists academy_comments_user_id_idx
  on public.academy_comments (user_id);

create index if not exists academy_comments_parent_id_idx
  on public.academy_comments (parent_id)
  where parent_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists academy_comments_set_updated_at on public.academy_comments;
create trigger academy_comments_set_updated_at
before update on public.academy_comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_academy_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
  generated_username text;
begin
  requested_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Academy Member'
  );

  generated_username := 'member_' || left(replace(new.id::text, '-', ''), 25);

  insert into public.profiles (id, username, display_name, avatar_index)
  values (
    new.id,
    generated_username,
    left(requested_name, 80),
    get_byte(uuid_send(new.id), 0) % 8
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_academy_user();

-- Backfill profiles if Auth already contains users when this schema is installed.
insert into public.profiles (id, username, display_name, avatar_index)
select
  users.id,
  'member_' || left(replace(users.id::text, '-', ''), 25),
  left(
    coalesce(
      nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(users.email, '@', 1), ''),
      'Academy Member'
    ),
    80
  ),
  get_byte(uuid_send(users.id), 0) % 8
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.academy_comments enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Comments are publicly readable" on public.academy_comments;
create policy "Comments are publicly readable"
on public.academy_comments
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "Users can create their own comments" on public.academy_comments;
create policy "Users can create their own comments"
on public.academy_comments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and deleted_at is null
);

drop policy if exists "Users can update their own comments" on public.academy_comments;
create policy "Users can update their own comments"
on public.academy_comments
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own comments" on public.academy_comments;
create policy "Users can delete their own comments"
on public.academy_comments
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, avatar_index) on public.profiles to authenticated;
grant select on public.academy_comments to anon, authenticated;
grant insert (user_id, parent_id, body) on public.academy_comments to authenticated;
grant update (parent_id, body, deleted_at) on public.academy_comments to authenticated;
grant delete on public.academy_comments to authenticated;
grant usage, select on sequence public.academy_comments_id_seq to authenticated;

commit;
