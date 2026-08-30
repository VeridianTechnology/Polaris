-- Previously applied through MCP. Add Australia's housing-awareness report to Academy > Map > Finance.
-- Run once after 2026-08-29_academy_map_united_states_finance.sql.

begin;

do $$
begin
  if to_regclass('public.academy_map_entries') is null then
    raise exception 'Run 2026-08-29_academy_map_repair_and_parties.sql first';
  end if;
end;
$$;

alter table public.academy_map_entries
  add column if not exists title text,
  add column if not exists score_display text;

insert into public.academy_map_entries (
  issue_key,
  entry_key,
  layer,
  parent_entry_key,
  map_label,
  image_path,
  primary_label,
  score,
  score_display,
  status,
  title,
  source_url,
  subtitle,
  author_name,
  sort_order
)
values (
  'september-2026',
  'australia-finance',
  'finance',
  'world',
  'Australia',
  '/politics-australia.jpg',
  'Australia',
  5,
  '+5',
  'Awareness',
  'First home buyer tax breaks',
  'https://x.com/AlboMP/status/2093876832164782506',
  'The Prime Minister of Australia has made a public commitment to cheaper housing through tax breaks for first time home buyers. I think this all cap, but at least the awareness has spread.',
  'NYX',
  3
)
on conflict (issue_key, entry_key) do update
set
  layer = excluded.layer,
  parent_entry_key = excluded.parent_entry_key,
  map_label = excluded.map_label,
  image_path = excluded.image_path,
  primary_label = excluded.primary_label,
  score = excluded.score,
  score_display = excluded.score_display,
  status = excluded.status,
  title = excluded.title,
  source_url = excluded.source_url,
  subtitle = excluded.subtitle,
  author_name = excluded.author_name,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

commit;
