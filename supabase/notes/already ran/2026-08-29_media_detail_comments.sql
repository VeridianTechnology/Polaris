-- Polaris video-detail entries and comments for Crime, Finance, and Freedom
-- Prepared August 29, 2026.
-- Run after 2026-08-29_agora_content_schema.sql.
-- This safely supersedes 2026-08-29_crime_comment_limit.sql if that file was run.

begin;

create table if not exists public.agora_freedom_entries (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null references public.agora_issues(issue_key) on delete cascade,
  item_number smallint not null check (item_number > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  status text default null check (status is null or status = 'ACTIVE'),
  subtitle text,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_key, item_number),
  unique (issue_key, slug)
);

alter table public.agora_crime_entries
  add column if not exists comments_count smallint not null default 0;
alter table public.agora_finance_entries
  add column if not exists comments_count smallint not null default 0;
alter table public.agora_freedom_entries
  add column if not exists comments_count smallint not null default 0;

insert into public.agora_finance_entries (
  issue_key,
  item_number,
  slug,
  title,
  status,
  subtitle,
  external_url
)
values
  (
    'september-2026',
    1,
    'strategy-room',
    'Inside the Strategy Room',
    null,
    'McKinsey basically thinks there''s going to be three times the US national debt in infrastructure spending over the next couple of decades, tons and tons of money basically. Investors and big-wigs can''t get enough, worth looking into. Obviously all of this is going to datacenters, whether that means in space or on land or in the sea, we don''t know yet.',
    'https://www.youtube.com/watch?v=LL9iuTpAmjA'
  ),
  (
    'september-2026',
    2,
    'crude-oil-to-motion',
    'From Crude Oil to Motion',
    null,
    'From crude oil to useful motion: where the energy goes and how much is lost as heat.',
    'https://www.youtube.com/watch?v=0zZyEF4Cq9U&t'
  )
on conflict (issue_key, item_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  status = excluded.status,
  subtitle = excluded.subtitle,
  external_url = excluded.external_url;

insert into public.agora_freedom_entries (
  issue_key,
  item_number,
  slug,
  title,
  status,
  subtitle,
  external_url
)
values (
  'september-2026',
  1,
  'flock-cameras',
  'Flock Cameras',
  'ACTIVE',
  'Flock Cameras are going up all over the United States, orginally to track criminals, they''re being used illictly by police for personal uses. Further, this creeps majorly on freedom in an a unique and unprecedent way.',
  'https://www.youtube.com/watch?v=S3MQLlMbS-Y'
)
on conflict (issue_key, item_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  status = excluded.status,
  subtitle = excluded.subtitle,
  external_url = excluded.external_url;

create table if not exists public.agora_finance_comments (
  id bigint generated always as identity primary key,
  issue_key text not null,
  finance_item_number smallint not null,
  author_name text not null default 'NYX' check (author_name = 'NYX'),
  body text not null check (char_length(btrim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  foreign key (issue_key, finance_item_number)
    references public.agora_finance_entries(issue_key, item_number)
    on delete cascade
);

create table if not exists public.agora_freedom_comments (
  id bigint generated always as identity primary key,
  issue_key text not null,
  freedom_item_number smallint not null,
  author_name text not null default 'NYX' check (author_name = 'NYX'),
  body text not null check (char_length(btrim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  foreign key (issue_key, freedom_item_number)
    references public.agora_freedom_entries(issue_key, item_number)
    on delete cascade
);

create index if not exists agora_finance_comments_entry_idx
  on public.agora_finance_comments (issue_key, finance_item_number, created_at);
create index if not exists agora_freedom_comments_entry_idx
  on public.agora_freedom_comments (issue_key, freedom_item_number, created_at);

drop trigger if exists agora_freedom_entries_set_updated_at
  on public.agora_freedom_entries;
create trigger agora_freedom_entries_set_updated_at
before update on public.agora_freedom_entries
for each row execute function public.set_agora_updated_at();

-- Backfill all three counters before adding the 0..15 constraints.
update public.agora_crime_entries as entry
set comments_count = coalesce(existing.total, 0)::smallint
from (
  select crime.issue_key, crime.item_number, count(comment.id) as total
  from public.agora_crime_entries as crime
  left join public.agora_crime_comments as comment
    on comment.issue_key = crime.issue_key
    and comment.crime_item_number = crime.item_number
  group by crime.issue_key, crime.item_number
) as existing
where entry.issue_key = existing.issue_key
  and entry.item_number = existing.item_number;

update public.agora_finance_entries as entry
set comments_count = coalesce(existing.total, 0)::smallint
from (
  select finance.issue_key, finance.item_number, count(comment.id) as total
  from public.agora_finance_entries as finance
  left join public.agora_finance_comments as comment
    on comment.issue_key = finance.issue_key
    and comment.finance_item_number = finance.item_number
  group by finance.issue_key, finance.item_number
) as existing
where entry.issue_key = existing.issue_key
  and entry.item_number = existing.item_number;

update public.agora_freedom_entries as entry
set comments_count = coalesce(existing.total, 0)::smallint
from (
  select freedom.issue_key, freedom.item_number, count(comment.id) as total
  from public.agora_freedom_entries as freedom
  left join public.agora_freedom_comments as comment
    on comment.issue_key = freedom.issue_key
    and comment.freedom_item_number = freedom.item_number
  group by freedom.issue_key, freedom.item_number
) as existing
where entry.issue_key = existing.issue_key
  and entry.item_number = existing.item_number;

do $$
begin
  if exists (select 1 from public.agora_crime_entries where comments_count > 15)
    or exists (select 1 from public.agora_finance_entries where comments_count > 15)
    or exists (select 1 from public.agora_freedom_entries where comments_count > 15) then
    raise exception 'An Agora entry already contains more than 15 comments. Remove excess comments before applying this migration.';
  end if;
end;
$$;

alter table public.agora_crime_entries
  drop constraint if exists agora_crime_entries_comments_count_check;
alter table public.agora_crime_entries
  add constraint agora_crime_entries_comments_count_check
  check (comments_count between 0 and 15);

alter table public.agora_finance_entries
  drop constraint if exists agora_finance_entries_comments_count_check;
alter table public.agora_finance_entries
  add constraint agora_finance_entries_comments_count_check
  check (comments_count between 0 and 15);

alter table public.agora_freedom_entries
  drop constraint if exists agora_freedom_entries_comments_count_check;
alter table public.agora_freedom_entries
  add constraint agora_freedom_entries_comments_count_check
  check (comments_count between 0 and 15);

create or replace function public.enforce_agora_media_comment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entries_table text := tg_argv[0];
  target_issue text;
  target_item smallint;
  current_count smallint;
begin
  if entries_table not in (
    'public.agora_crime_entries',
    'public.agora_finance_entries',
    'public.agora_freedom_entries'
  ) then
    raise exception 'Unsupported Agora entry table';
  end if;

  if tg_op = 'INSERT' then
    target_issue := new.issue_key;

    if tg_table_name = 'agora_crime_comments' then
      target_item := new.crime_item_number;
    elsif tg_table_name = 'agora_finance_comments' then
      target_item := new.finance_item_number;
    elsif tg_table_name = 'agora_freedom_comments' then
      target_item := new.freedom_item_number;
    else
      raise exception 'Unsupported Agora comments table';
    end if;

    execute format(
      'select comments_count from %s where issue_key = $1 and item_number = $2 for update',
      entries_table
    )
    into current_count
    using target_issue, target_item;

    if current_count is null then
      raise foreign_key_violation using
        message = 'The requested Agora entry does not exist.';
    end if;

    if current_count >= 15 then
      raise check_violation using
        message = 'This discussion has reached its 15-comment limit.';
    end if;

    execute format(
      'update %s set comments_count = comments_count + 1 where issue_key = $1 and item_number = $2',
      entries_table
    )
    using target_issue, target_item;

    return new;
  end if;

  if tg_op = 'DELETE' then
    target_issue := old.issue_key;

    if tg_table_name = 'agora_crime_comments' then
      target_item := old.crime_item_number;
    elsif tg_table_name = 'agora_finance_comments' then
      target_item := old.finance_item_number;
    elsif tg_table_name = 'agora_freedom_comments' then
      target_item := old.freedom_item_number;
    else
      raise exception 'Unsupported Agora comments table';
    end if;

    execute format(
      'update %s set comments_count = greatest(comments_count - 1, 0) where issue_key = $1 and item_number = $2',
      entries_table
    )
    using target_issue, target_item;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_agora_crime_comment_limit_before_insert
  on public.agora_crime_comments;
drop trigger if exists decrement_agora_crime_comment_count_after_delete
  on public.agora_crime_comments;
drop trigger if exists enforce_agora_media_comment_limit_before_insert
  on public.agora_crime_comments;
drop trigger if exists decrement_agora_media_comment_count_after_delete
  on public.agora_crime_comments;

create trigger enforce_agora_media_comment_limit_before_insert
before insert on public.agora_crime_comments
for each row execute function public.enforce_agora_media_comment_limit('public.agora_crime_entries');
create trigger decrement_agora_media_comment_count_after_delete
after delete on public.agora_crime_comments
for each row execute function public.enforce_agora_media_comment_limit('public.agora_crime_entries');

drop trigger if exists enforce_agora_media_comment_limit_before_insert
  on public.agora_finance_comments;
drop trigger if exists decrement_agora_media_comment_count_after_delete
  on public.agora_finance_comments;
create trigger enforce_agora_media_comment_limit_before_insert
before insert on public.agora_finance_comments
for each row execute function public.enforce_agora_media_comment_limit('public.agora_finance_entries');
create trigger decrement_agora_media_comment_count_after_delete
after delete on public.agora_finance_comments
for each row execute function public.enforce_agora_media_comment_limit('public.agora_finance_entries');

drop trigger if exists enforce_agora_media_comment_limit_before_insert
  on public.agora_freedom_comments;
drop trigger if exists decrement_agora_media_comment_count_after_delete
  on public.agora_freedom_comments;
create trigger enforce_agora_media_comment_limit_before_insert
before insert on public.agora_freedom_comments
for each row execute function public.enforce_agora_media_comment_limit('public.agora_freedom_entries');
create trigger decrement_agora_media_comment_count_after_delete
after delete on public.agora_freedom_comments
for each row execute function public.enforce_agora_media_comment_limit('public.agora_freedom_entries');

alter table public.agora_freedom_entries enable row level security;
alter table public.agora_finance_comments enable row level security;
alter table public.agora_freedom_comments enable row level security;

drop policy if exists "Agora freedom entries are publicly readable"
  on public.agora_freedom_entries;
create policy "Agora freedom entries are publicly readable"
on public.agora_freedom_entries for select to anon, authenticated using (true);

drop policy if exists "Agora finance comments are publicly readable"
  on public.agora_finance_comments;
create policy "Agora finance comments are publicly readable"
on public.agora_finance_comments for select to anon, authenticated using (true);

drop policy if exists "NYX can create Agora finance comments"
  on public.agora_finance_comments;
create policy "NYX can create Agora finance comments"
on public.agora_finance_comments
for insert to anon, authenticated
with check (author_name = 'NYX');

drop policy if exists "Agora freedom comments are publicly readable"
  on public.agora_freedom_comments;
create policy "Agora freedom comments are publicly readable"
on public.agora_freedom_comments for select to anon, authenticated using (true);

drop policy if exists "NYX can create Agora freedom comments"
  on public.agora_freedom_comments;
create policy "NYX can create Agora freedom comments"
on public.agora_freedom_comments
for insert to anon, authenticated
with check (author_name = 'NYX');

grant select on public.agora_freedom_entries to anon, authenticated;
grant select on public.agora_finance_comments to anon, authenticated;
grant insert (issue_key, finance_item_number, author_name, body)
  on public.agora_finance_comments to anon, authenticated;
grant usage, select on sequence public.agora_finance_comments_id_seq
  to anon, authenticated;
grant select on public.agora_freedom_comments to anon, authenticated;
grant insert (issue_key, freedom_item_number, author_name, body)
  on public.agora_freedom_comments to anon, authenticated;
grant usage, select on sequence public.agora_freedom_comments_id_seq
  to anon, authenticated;

revoke all on function public.enforce_agora_media_comment_limit() from public;

commit;
