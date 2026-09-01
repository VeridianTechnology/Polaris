-- Academy People entries and per-person discussions.
-- Each person has an independently enforced maximum of 25 comments.

begin;

do $$
begin
  if to_regclass('public.academy_issues') is null then
    raise exception 'Run the Academy content migrations before People comments';
  end if;
end;
$$;

create table if not exists public.academy_people_entries (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null references public.academy_issues(issue_key) on delete cascade,
  item_number smallint not null check (item_number > 0),
  category text not null check (category = 'right-wing'),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  subtitle text not null check (char_length(btrim(subtitle)) between 1 and 1200),
  image_path text not null,
  external_url text not null check (external_url ~* '^https?://[^[:space:]]+$'),
  comments_count smallint not null default 0 check (comments_count between 0 and 25),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_key, item_number),
  unique (issue_key, slug)
);

insert into public.academy_people_entries (
  issue_key,
  item_number,
  category,
  slug,
  title,
  subtitle,
  image_path,
  external_url
)
values
  (
    'september-2026',
    1,
    'right-wing',
    'zoomerwoman',
    'New Right Wing Darling',
    'Interesting woman with some pretty based takes, new to the scene.',
    '/people-zoomerwoman.png',
    'https://x.com/zoomerwoman'
  ),
  (
    'september-2026',
    2,
    'right-wing',
    'paul-miller',
    'Paul Miller',
    'Paul came of a huge kickboxing win against some nobody, very enetertaining, very big.',
    '/people-paul-miller.jpeg',
    'https://x.com/jokerwaffenfren/status/2093897382987469245'
  )
on conflict (issue_key, item_number) do update set
  category = excluded.category,
  slug = excluded.slug,
  title = excluded.title,
  subtitle = excluded.subtitle,
  image_path = excluded.image_path,
  external_url = excluded.external_url,
  updated_at = now();

create table if not exists public.academy_people_comments (
  id bigint generated always as identity primary key,
  issue_key text not null,
  people_item_number smallint not null,
  author_name text not null default 'NYX' check (author_name = 'NYX'),
  body text not null check (char_length(btrim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  foreign key (issue_key, people_item_number)
    references public.academy_people_entries(issue_key, item_number)
    on delete cascade
);

create index if not exists academy_people_comments_entry_idx
  on public.academy_people_comments (issue_key, people_item_number, created_at);

drop trigger if exists academy_people_entries_set_updated_at
  on public.academy_people_entries;
create trigger academy_people_entries_set_updated_at
before update on public.academy_people_entries
for each row execute function public.set_updated_at();

create or replace function public.enforce_academy_people_comment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count smallint;
begin
  if tg_op = 'INSERT' then
    select entry.comments_count
    into current_count
    from public.academy_people_entries as entry
    where entry.issue_key = new.issue_key
      and entry.item_number = new.people_item_number
    for update;

    if not found then
      raise foreign_key_violation using
        message = 'The requested People entry does not exist.';
    end if;

    if current_count >= 25 then
      raise check_violation using
        message = 'This People discussion has reached its 25-comment limit.';
    end if;

    update public.academy_people_entries as entry
    set comments_count = comments_count + 1
    where entry.issue_key = new.issue_key
      and entry.item_number = new.people_item_number;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.academy_people_entries as entry
    set comments_count = greatest(comments_count - 1, 0)
    where entry.issue_key = old.issue_key
      and entry.item_number = old.people_item_number;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_academy_people_comment_limit_before_insert
  on public.academy_people_comments;
create trigger enforce_academy_people_comment_limit_before_insert
before insert on public.academy_people_comments
for each row execute function public.enforce_academy_people_comment_limit();

drop trigger if exists decrement_academy_people_comment_count_after_delete
  on public.academy_people_comments;
create trigger decrement_academy_people_comment_count_after_delete
after delete on public.academy_people_comments
for each row execute function public.enforce_academy_people_comment_limit();

alter table public.academy_people_entries enable row level security;
alter table public.academy_people_comments enable row level security;

drop policy if exists "Academy People entries are publicly readable"
  on public.academy_people_entries;
create policy "Academy People entries are publicly readable"
on public.academy_people_entries for select to anon, authenticated using (true);

drop policy if exists "Academy People comments are publicly readable"
  on public.academy_people_comments;
create policy "Academy People comments are publicly readable"
on public.academy_people_comments for select to anon, authenticated using (true);

drop policy if exists "NYX can create Academy People comments"
  on public.academy_people_comments;
create policy "NYX can create Academy People comments"
on public.academy_people_comments
for insert to anon, authenticated
with check (author_name = 'NYX');

grant select on public.academy_people_entries to anon, authenticated;
grant select on public.academy_people_comments to anon, authenticated;
grant insert (issue_key, people_item_number, author_name, body)
  on public.academy_people_comments to anon, authenticated;
grant usage, select on sequence public.academy_people_comments_id_seq
  to anon, authenticated;

revoke all on function public.enforce_academy_people_comment_limit() from public;

commit;
