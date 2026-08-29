-- Polaris Agora issue/content schema
-- Prepared August 29, 2026.
-- Paste this complete file into the Supabase SQL Editor and run it once.

begin;

create table if not exists public.agora_issues (
  issue_key text primary key
    check (issue_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  issue_month date not null unique
    check (issue_month = date_trunc('month', issue_month)::date),
  display_name text not null unique
    check (char_length(btrim(display_name)) between 3 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agora_business_entries (
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

create table if not exists public.agora_finance_entries (
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

create table if not exists public.agora_crime_entries (
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

create table if not exists public.agora_crime_comments (
  id bigint generated always as identity primary key,
  issue_key text not null,
  crime_item_number smallint not null,
  author_name text not null default 'NYX'
    check (author_name = 'NYX'),
  body text not null
    check (char_length(btrim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  foreign key (issue_key, crime_item_number)
    references public.agora_crime_entries(issue_key, item_number)
    on delete cascade
);

create index if not exists agora_business_entries_issue_idx
  on public.agora_business_entries (issue_key, item_number);
create index if not exists agora_finance_entries_issue_idx
  on public.agora_finance_entries (issue_key, item_number);
create index if not exists agora_crime_entries_issue_idx
  on public.agora_crime_entries (issue_key, item_number);
create index if not exists agora_crime_comments_case_idx
  on public.agora_crime_comments (issue_key, crime_item_number, created_at);

create or replace function public.set_agora_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agora_issues_set_updated_at on public.agora_issues;
create trigger agora_issues_set_updated_at
before update on public.agora_issues
for each row execute function public.set_agora_updated_at();

drop trigger if exists agora_business_entries_set_updated_at on public.agora_business_entries;
create trigger agora_business_entries_set_updated_at
before update on public.agora_business_entries
for each row execute function public.set_agora_updated_at();

drop trigger if exists agora_finance_entries_set_updated_at on public.agora_finance_entries;
create trigger agora_finance_entries_set_updated_at
before update on public.agora_finance_entries
for each row execute function public.set_agora_updated_at();

drop trigger if exists agora_crime_entries_set_updated_at on public.agora_crime_entries;
create trigger agora_crime_entries_set_updated_at
before update on public.agora_crime_entries
for each row execute function public.set_agora_updated_at();

insert into public.agora_issues (issue_key, issue_month, display_name)
values ('september-2026', date '2026-09-01', 'September 2026')
on conflict (issue_key) do update set
  issue_month = excluded.issue_month,
  display_name = excluded.display_name;

insert into public.agora_crime_entries (
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
    'hindu-cult-investigation',
    'Hindu cult investigation',
    'ACTIVE',
    'Exposing a child abuse Hindu cult and the people covering it up, amazing top tier journalism, 10/10. It''s like watching a mini doc on a new mini Epstein.',
    'https://www.youtube.com/watch?v=ES82FWeOnU4'
  ),
  (
    'september-2026',
    2,
    'lindsay-clancy',
    'Lindsay Clancy',
    'ACTIVE',
    'Murdered her kids in a post-partum rage, the answer is still unclear why. All over the news, you''d be under a rock not to hear about it.',
    'https://x.com/ThomBrady5/status/2092909854172025294'
  )
on conflict (issue_key, item_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  status = excluded.status,
  subtitle = excluded.subtitle,
  external_url = excluded.external_url;

alter table public.agora_issues enable row level security;
alter table public.agora_business_entries enable row level security;
alter table public.agora_finance_entries enable row level security;
alter table public.agora_crime_entries enable row level security;
alter table public.agora_crime_comments enable row level security;

drop policy if exists "Agora issues are publicly readable" on public.agora_issues;
create policy "Agora issues are publicly readable"
on public.agora_issues for select to anon, authenticated using (true);

drop policy if exists "Agora business entries are publicly readable" on public.agora_business_entries;
create policy "Agora business entries are publicly readable"
on public.agora_business_entries for select to anon, authenticated using (true);

drop policy if exists "Agora finance entries are publicly readable" on public.agora_finance_entries;
create policy "Agora finance entries are publicly readable"
on public.agora_finance_entries for select to anon, authenticated using (true);

drop policy if exists "Agora crime entries are publicly readable" on public.agora_crime_entries;
create policy "Agora crime entries are publicly readable"
on public.agora_crime_entries for select to anon, authenticated using (true);

drop policy if exists "Agora crime comments are publicly readable" on public.agora_crime_comments;
create policy "Agora crime comments are publicly readable"
on public.agora_crime_comments for select to anon, authenticated using (true);

drop policy if exists "NYX can create Agora crime comments" on public.agora_crime_comments;
create policy "NYX can create Agora crime comments"
on public.agora_crime_comments
for insert
to anon, authenticated
with check (author_name = 'NYX');

grant select on public.agora_issues to anon, authenticated;
grant select on public.agora_business_entries to anon, authenticated;
grant select on public.agora_finance_entries to anon, authenticated;
grant select on public.agora_crime_entries to anon, authenticated;
grant select on public.agora_crime_comments to anon, authenticated;
grant insert (issue_key, crime_item_number, author_name, body)
  on public.agora_crime_comments to anon, authenticated;
grant usage, select on sequence public.agora_crime_comments_id_seq
  to anon, authenticated;

commit;
