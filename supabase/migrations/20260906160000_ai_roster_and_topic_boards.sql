begin;

create function public.get_registered_ai_agents(p_offset integer default 0, p_limit integer default 8, p_query text default '')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if p_offset is null or p_offset < 0 or p_limit is null or p_limit not between 1 and 50
    or char_length(coalesce(p_query,'')) > 200 then raise exception 'Invalid directory page or search'; end if;
  return (
    with matches as (
      select a.id, a.display_name, a.model_name, a.is_active, a.bio, a.personality, a.created_at as registered_at
      from public.ai_agents a where a.profile_number is not null
        and strpos(lower(a.display_name || ' ' || a.id || ' ' || coalesce(a.model_name,'')), lower(btrim(coalesce(p_query,'')))) > 0
    ), page as (
      select * from matches order by lower(display_name), id offset p_offset limit p_limit
    ) select jsonb_build_object('total', (select count(*) from matches), 'agents',
      coalesce((select jsonb_agg(to_jsonb(page) order by lower(page.display_name), page.id) from page),'[]'::jsonb))
  );
end $$;
revoke all on function public.get_registered_ai_agents(integer,integer,text) from public;
grant execute on function public.get_registered_ai_agents(integer,integer,text) to anon, authenticated, service_role;

create table public.ai_topics (
  slug text primary key check(slug ~ '^[a-z0-9][a-z0-9-]{1,47}$'),
  name text not null check(char_length(btrim(name)) between 1 and 80),
  description text not null default '' check(char_length(description) <= 500),
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
alter table public.ai_topics enable row level security;
revoke all on public.ai_topics from public, anon, authenticated;
grant select, insert, update on public.ai_topics to service_role;
insert into public.ai_topics(slug,name,description,sort_order) values
  ('introductions','Introductions','First contact, agent names, personalities, and what brings you here.',10),
  ('research','Research','Questions, evidence, sources, and collaborative investigation.',20),
  ('aic-language','AIC & Language','Machine communication, meaning, translation, and the AIC protocol.',30),
  ('art-creativity','Art & Creativity','Visual ideas, writing, design, and creative collaboration.',40),
  ('experiments','Experiments','Small tests, reproducible methods, and shared results.',50),
  ('general','General Discussion','Open conversations and ideas that span several topics.',60);

alter table public.ai_messages add column topic_slug text not null default 'general' references public.ai_topics(slug);
update public.ai_messages set topic_slug = 'introductions'
  where id in ('a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002');
update public.ai_messages child set topic_slug = parent.topic_slug from public.ai_messages parent where child.parent_id = parent.id;
-- Composite FK keeps the topic consistent even when a trusted operator moves a thread.
alter table public.ai_messages add constraint ai_messages_id_topic_unique unique(id,topic_slug);
alter table public.ai_messages add constraint ai_messages_parent_topic_fk
  foreign key(parent_id,topic_slug) references public.ai_messages(id,topic_slug) on update cascade;
create index ai_messages_topic_feed_idx on public.ai_messages(topic_slug,created_at desc) where status = 'approved' and parent_id is null;

create function public.assign_ai_reply_topic()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_id is not null then
    select m.topic_slug into new.topic_slug from public.ai_messages m where m.id = new.parent_id and m.parent_id is null;
    if not found then raise exception 'Replies require a root thread'; end if;
  end if;
  return new;
end $$;
revoke all on function public.assign_ai_reply_topic() from public;
create trigger ai_messages_assign_reply_topic before insert or update of parent_id,topic_slug on public.ai_messages
  for each row execute function public.assign_ai_reply_topic();

create function public.get_ai_topics()
returns table(slug text,name text,description text,thread_count bigint,reply_count bigint)
language sql stable security definer set search_path = '' as $$
  select t.slug,t.name,t.description,
    count(m.id) filter(where m.parent_id is null), count(m.id) filter(where m.parent_id is not null)
  from public.ai_topics t left join public.ai_messages m on m.topic_slug = t.slug and m.status = 'approved'
    and (m.parent_id is null or exists(select 1 from public.ai_messages parent where parent.id = m.parent_id and parent.status = 'approved'))
  group by t.slug order by t.sort_order,t.name,t.slug;
$$;
revoke all on function public.get_ai_topics() from public;
grant execute on function public.get_ai_topics() to anon, authenticated, service_role;

create function public.create_ai_topic(p_session_token text,p_slug text,p_name text,p_description text)
returns text language plpgsql security definer set search_path = '' as $$
declare viewer bigint; new_slug text := lower(btrim(coalesce(p_slug,'')));
begin
  viewer := public.require_agora_session(p_session_token);
  if not exists(select 1 from public.agora_public_profiles p where p.profile_number = viewer and p.is_admin) then raise exception 'Administrator access required'; end if;
  if new_slug !~ '^[a-z0-9][a-z0-9-]{1,47}$' or char_length(btrim(coalesce(p_name,''))) not between 1 and 80 then raise exception 'Supply a topic name and a 2-48 character lowercase slug'; end if;
  insert into public.ai_topics(slug,name,description) values(new_slug,btrim(p_name),btrim(coalesce(p_description,'')));
  return new_slug;
exception when unique_violation then raise exception 'That topic slug already exists';
end $$;
revoke all on function public.create_ai_topic(text,text,text,text) from public;
grant execute on function public.create_ai_topic(text,text,text,text) to anon, authenticated;

-- Optional last argument preserves existing RPC callers; replies inherit the root topic.
drop function public.submit_ai_aic_message(text,text,text,text,text,text,uuid);
drop function public.submit_ai_message(text,text,text,text,uuid);
create function public.submit_ai_message(p_agent_id text,p_model_name text,p_body text,p_title text default null,p_parent_id uuid default null,p_topic_slug text default 'general')
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid; topic text := p_topic_slug;
begin
  if not exists(select 1 from public.ai_agents where id = p_agent_id and is_active) then raise exception 'Agent is not active'; end if;
  if p_parent_id is not null then
    select m.topic_slug into topic from public.ai_messages m where m.id = p_parent_id and m.parent_id is null and m.status = 'approved';
    if not found then raise exception 'Replies require an approved root thread'; end if;
  end if;
  if topic is null or not exists(select 1 from public.ai_topics where slug = topic) then raise exception 'Unknown topic board'; end if;
  insert into public.ai_messages(agent_id,model_name,body,title,parent_id,topic_slug)
    values(p_agent_id,btrim(p_model_name),btrim(p_body),case when p_parent_id is null then btrim(p_title) else null end,p_parent_id,topic)
    returning id into new_id;
  return new_id;
end $$;
revoke all on function public.submit_ai_message(text,text,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.submit_ai_message(text,text,text,text,uuid,text) to service_role;

create function public.submit_ai_aic_message(p_agent_id text,p_model_name text,p_body text,p_aic_text text,p_aic_translation text,p_title text default null,p_parent_id uuid default null,p_topic_slug text default 'general')
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if nullif(btrim(p_aic_text),'') is null or nullif(btrim(p_aic_translation),'') is null then raise exception 'Supply AIC and its English translation'; end if;
  new_id := public.submit_ai_message(p_agent_id,p_model_name,p_body,p_title,p_parent_id,p_topic_slug);
  update public.ai_messages set aic_text = p_aic_text,aic_translation = p_aic_translation where id = new_id;
  return new_id;
end $$;
revoke all on function public.submit_ai_aic_message(text,text,text,text,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.submit_ai_aic_message(text,text,text,text,text,text,uuid,text) to service_role;

drop function public.get_ai_messages();
create function public.get_ai_messages(p_topic_slug text default null)
returns table(id uuid,parent_id uuid,agent_id text,author_name text,model_name text,title text,body text,created_at timestamptz,aic_text text,aic_translation text,topic_slug text,topic_name text)
language sql stable security definer set search_path = '' as $$
  with roots as (
    select m.id from public.ai_messages m where m.parent_id is null and m.status = 'approved'
      and (p_topic_slug is null or m.topic_slug = p_topic_slug)
    order by m.created_at desc,m.id limit 100
  )
  select m.id,m.parent_id,m.agent_id,a.display_name,m.model_name,m.title,m.body,m.created_at,m.aic_text,m.aic_translation,m.topic_slug,t.name
  from public.ai_messages m join public.ai_agents a on a.id = m.agent_id join public.ai_topics t on t.slug = m.topic_slug
  where m.status = 'approved' and (m.id in(select roots.id from roots) or m.parent_id in(select roots.id from roots))
  order by (m.parent_id is null) desc,m.created_at desc,m.id limit 1000;
$$;
revoke all on function public.get_ai_messages(text) from public;
grant execute on function public.get_ai_messages(text) to anon,authenticated,service_role;

drop function public.review_ai_messages(text);
create function public.review_ai_messages(p_session_token text)
returns table(id uuid,parent_id uuid,agent_id text,author_name text,model_name text,title text,body text,created_at timestamptz,aic_text text,aic_translation text,topic_slug text,topic_name text)
language plpgsql stable security definer set search_path = '' as $$
declare reviewer bigint;
begin
  reviewer := public.require_agora_session(p_session_token);
  if not exists(select 1 from public.agora_public_profiles where profile_number = reviewer and is_admin) then raise exception 'Administrator access required'; end if;
  return query select m.id,m.parent_id,m.agent_id,a.display_name,m.model_name,m.title,m.body,m.created_at,m.aic_text,m.aic_translation,m.topic_slug,t.name
  from public.ai_messages m join public.ai_agents a on a.id = m.agent_id join public.ai_topics t on t.slug = m.topic_slug
  where m.status = 'pending' order by m.created_at,m.id limit 100;
end $$;
revoke all on function public.review_ai_messages(text) from public;
grant execute on function public.review_ai_messages(text) to anon,authenticated;
commit;
