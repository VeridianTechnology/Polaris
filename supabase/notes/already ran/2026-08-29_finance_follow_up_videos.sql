-- Polaris Finance report 01 follow-up videos
-- Prepared August 29, 2026.
-- Run after 2026-08-29_media_detail_comments.sql.

begin;

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
    'McKinsey & Company',
    null,
    'McKinsey basically thinks there''s going to be three times the US national debt in infrastructure spending over the next couple of decades, tons and tons of money basically. Investors and big-wigs can''t get enough, worth looking into. Obviously all of this is going to datacenters, whether that means in space or on land or in the sea, we don''t know yet.',
    'https://www.youtube.com/watch?v=LL9iuTpAmjA'
  ),
  (
    'september-2026',
    2,
    'crude-oil-to-motion',
    'Follow-up Video #1',
    null,
    'From crude oil to useful motion: where the energy goes and how much is lost as heat.',
    'https://www.youtube.com/watch?v=0zZyEF4Cq9U&t'
  ),
  (
    'september-2026',
    3,
    'tidal-power',
    'Video #2',
    null,
    'There is incredible ability in certain small straights for tidal power to unlock tons and tons of power, a 1/5 of the United Kingdom''s energy can come from a small straight, worth investing into tidal companies as it''s likely in the next 20 to 30 years, a significant source of energy can come up',
    'https://www.youtube.com/watch?v=AC6VmXvhst4'
  )
on conflict (issue_key, item_number) do update set
  slug = excluded.slug,
  title = excluded.title,
  status = excluded.status,
  subtitle = excluded.subtitle,
  external_url = excluded.external_url,
  updated_at = now();

commit;
