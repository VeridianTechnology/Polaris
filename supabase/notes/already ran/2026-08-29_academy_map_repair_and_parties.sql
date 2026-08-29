-- Canonical Academy Map data after the Agora/Academy title swap.
-- This is intentionally separate from the Agora login/admin migration.
-- Run once AFTER 2026-08-29_agora_academy_title_swap.sql.

begin;

do $$
begin
  if to_regclass('public.academy_issues') is null then
    raise exception 'Run the Agora/Academy title-swap migration before this Map migration.';
  end if;
end;
$$;

create table if not exists public.academy_map_entries (
  issue_key text not null
    references public.academy_issues(issue_key) on delete cascade,
  entry_key text not null
    check (entry_key ~ '^[a-z][a-z0-9-]*$'),
  layer text not null
    check (layer in ('flash-points', 'finance', 'political-parties')),
  parent_entry_key text,
  map_label text not null,
  image_path text not null,
  primary_label text,
  counterpart_label text,
  score integer,
  status text,
  source_url text,
  subtitle text,
  author_name text not null default 'NYX',
  sort_order smallint not null default 1
    check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (issue_key, entry_key),
  constraint academy_map_entries_source_url_check
    check (source_url is null or source_url ~* '^https?://')
);

drop trigger if exists academy_map_entries_set_updated_at
  on public.academy_map_entries;
create trigger academy_map_entries_set_updated_at
before update on public.academy_map_entries
for each row execute function public.set_academy_updated_at();

insert into public.academy_map_entries (
  issue_key,
  entry_key,
  layer,
  parent_entry_key,
  map_label,
  image_path,
  primary_label,
  counterpart_label,
  score,
  status,
  source_url,
  subtitle,
  sort_order
)
values
  ('september-2026', 'middle-east', 'flash-points', 'world', 'Middle East', '/politics-middle-east.jpg', null, null, null, null, null, null, 1),
  ('september-2026', 'israel', 'flash-points', 'middle-east', 'Israel', '/politics-israel.jpg', 'Israel', 'Turkey', -75, null, 'https://www.youtube.com/watch?v=K313YV2lmmw', 'Essentially F35s, the latest US aircraft cannot be sent or bought by Turkey because Israel is starting to see Turkey as opposition in the Middle East. Not now, but conflict looks like it could be likely within 20 to 40 years.', 2),
  ('september-2026', 'turkey', 'flash-points', 'middle-east', 'Turkey', '/politics-turkey.jpg', null, null, null, null, null, null, 3),
  ('september-2026', 'ukraine', 'flash-points', 'world', 'Ukraine', '/politics-ukraine.jpg', 'Ukraine', 'Russia', -160, 'Active War', 'https://www.youtube.com/watch?v=K0cHrknGz-U', 'The whole war has become a giant nothingburger and a war of economic attrition against Russia to bring it''s oil exports and war machinery to a halt, unsuccessful while Russia has taken less territory than Manhatten in the following year. A real snoozefest, but an active and tragic one.', 4),
  ('september-2026', 'russia', 'flash-points', 'world', 'Russia', '/politics-russia.jpg', null, null, null, null, null, null, 5),
  ('september-2026', 'taiwan', 'flash-points', 'world', 'Taiwan', '/politics-taiwan.jpg', 'Taiwan', 'China', -140, 'Mortal Enemies', 'https://www.youtube.com/watch?v=hogzHyUpe_Y', 'Chinese demographics are urging it to conflict sooner, than later. I disagree with Tom Bilyeu''s sentiment, American debt necessitates that China wait until America is weak, but there is some evidence to the contrary. The collapsing birth rate is the most pressing issue for China urging it forward against the United States and against Taiwan.', 6),
  ('september-2026', 'alberta', 'flash-points', 'world', 'Alberta', '/politics-alberta.jpg', 'Alberta', 'United States', -25, null, 'https://www.youtube.com/watch?v=fr4__yr0gXE&t=934s', 'American pressure on Alberta is mostly verbal at this point but within 50 years, it is extremely likely at the current rate Alberta will become American. Right now, it''s mostly a meme, but this is causing some hostility. Ironically, the warming of American relations to Alberta caused many that lived in Alberta to be against secession.', 7),
  ('september-2026', 'japan', 'finance', 'world', 'Japan', '/politics-japan.jpg', 'Japan', null, -30, 'Financial Stability Score', 'https://www.youtube.com/watch?v=NSx2d9tTd8A', 'Japan is running into debt problems, needing to sell of US treasuries for dollars to guard the yen, ultimately needing a bailout from the United States.', 1),
  ('september-2026', 'australia', 'political-parties', 'world', 'Australia', '/politics-australia.jpg', 'Libertarian Group of Australia', null, null, null, 'https://www.facebook.com/AusConLib', 'Extreme boomer humor meme page but has 58k followers and at this point, if there''s anything worth supporting in Australia, this would be it. A sad and miserable start, but a start nonetheless.', 1)
on conflict (issue_key, entry_key) do update
set
  layer = excluded.layer,
  parent_entry_key = excluded.parent_entry_key,
  map_label = excluded.map_label,
  image_path = excluded.image_path,
  primary_label = excluded.primary_label,
  counterpart_label = excluded.counterpart_label,
  score = excluded.score,
  status = excluded.status,
  source_url = excluded.source_url,
  subtitle = excluded.subtitle,
  author_name = excluded.author_name,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

alter table public.academy_map_entries enable row level security;

drop policy if exists "Academy map entries are publicly readable"
  on public.academy_map_entries;
create policy "Academy map entries are publicly readable"
on public.academy_map_entries
for select
to anon, authenticated
using (is_active);

grant select on public.academy_map_entries to anon, authenticated;
revoke insert, update, delete on public.academy_map_entries from anon, authenticated;

commit;
