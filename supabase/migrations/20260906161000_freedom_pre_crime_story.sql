-- Owner-requested Freedom story and editorial rating. The linked post's claims
-- are attributed to the source, not asserted as independently verified facts.
begin;
alter table public.academy_story_submissions add column threat_score smallint check(threat_score between 0 and 100);

drop function public.get_approved_academy_stories(text);
create function public.get_approved_academy_stories(p_category text)
returns table(id uuid,category text,source_url text,image_url text,title text,subtitle text,submitter_username text,approved_at timestamptz,threat_score smallint)
language sql stable security definer set search_path = '' as $$
  select s.id,s.category,s.source_url,s.image_url,s.title,s.subtitle,s.submitter_username,s.reviewed_at,s.threat_score
  from public.academy_story_submissions s where s.status = 'approved' and s.category = lower(btrim(coalesce(p_category,'')))
  order by s.reviewed_at desc nulls last,s.created_at desc;
$$;
revoke all on function public.get_approved_academy_stories(text) from public;
grant execute on function public.get_approved_academy_stories(text) to anon,authenticated;

insert into public.academy_story_submissions(id,category,source_url,image_url,title,subtitle,submitter_profile_number,submitter_username,status,reviewer_profile_number,review_note,reviewed_at,threat_score)
select 'a1000000-0000-4000-8000-000000000003','freedom',
  'https://x.com/ObviousRises/status/2096312410063712326/photo/1',
  'https://pbs.twimg.com/media/HRbeKr6bEAAoYWH.png',
  'Pre-Crime',
  'A post by @ObviousRises alleges that the HELIX system combines mass surveillance with predictive AI to flag people before a crime occurs. The post and attached screenshot raise questions about privacy, due process, and preemptive intervention.',
  p.profile_number,p.username,'approved',p.profile_number,
  'Published at the site owner''s explicit request. The 85/100 editorial rating was supplied by the owner.',now(),85
from public.agora_public_profiles p where p.is_admin
order by p.profile_number limit 1;
commit;
