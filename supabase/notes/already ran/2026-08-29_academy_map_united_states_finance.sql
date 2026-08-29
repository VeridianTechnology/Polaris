-- Add the United States housing report to Academy > Map > Finance.
-- Run once after 2026-08-29_academy_map_repair_and_parties.sql.

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
  sort_order
)
values (
  'september-2026',
  'united-states',
  'finance',
  'world',
  'United States',
  '/politics-united-states.jpg',
  'United States',
  20,
  '20+',
  'Stability',
  'Boomers are losing home value',
  'https://www.youtube.com/watch?v=09FevuUtoOc',
  'Finally, the housing slump begins. This is actually great, a full on crash would be a disaster but if year over year, the next three to five years, home prices go down 50%, it would be amazing for the middle class, youngsters and the economy. The "number must go up" is doing incredible damage to the working class, boomers basically did it to themselves by milking and robbing the younger generations so hard, there''s no one to buy up their inflated home property values. Good. Fuck them.',
  2
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
