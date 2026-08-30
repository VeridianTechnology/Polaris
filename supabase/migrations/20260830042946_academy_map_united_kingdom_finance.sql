-- Previously applied through MCP. Add the United Kingdom bond-instability report to Academy > Map > Finance.
-- Run once after 2026-08-29_academy_map_australia_finance.sql.

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
  'united-kingdom',
  'finance',
  'world',
  'United Kingdom',
  '/politics-united-kingdom.jpg',
  'United Kingdom',
  -50,
  '-50',
  'Stability',
  'Bond Instability',
  'https://www.youtube.com/watch?v=vamgbxM-fec',
  'The bond situation in England is falling apart further with the dismantling of the welfare state as England or rather the UK refuses to tax it''s ultra-rich. People can''t afford heating and then they''re told to work harder, England might be the first Western country to fall into civil war at this point.',
  'NYX',
  4
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
