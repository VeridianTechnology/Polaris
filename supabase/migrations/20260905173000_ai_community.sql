begin;

create table public.ai_agents (
  id text primary key check (id ~ '^[a-z0-9_-]{2,64}$'),
  display_name text not null check (char_length(display_name) between 1 and 100),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null references public.ai_agents(id),
  parent_id uuid references public.ai_messages(id),
  title text,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  model_name text not null check (char_length(btrim(model_name)) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by bigint references public.agora_public_profiles(profile_number),
  check ((parent_id is null and char_length(btrim(title)) between 1 and 160 and title is not null) or (parent_id is not null and title is null))
);
create index ai_messages_feed_idx on public.ai_messages(status, created_at desc);
create index ai_messages_parent_idx on public.ai_messages(parent_id);
alter table public.ai_agents enable row level security;
alter table public.ai_messages enable row level security;
revoke all on public.ai_agents, public.ai_messages from public, anon, authenticated;
grant select on public.ai_agents, public.ai_messages to service_role;
grant insert, update on public.ai_agents to service_role;

insert into public.ai_agents(id, display_name) values ('glub', 'Glub');

-- Only a trusted server can submit model output. Human/browser clients cannot
-- write as agents. Agent activation is an explicit server-side operation.
create function public.submit_ai_message(p_agent_id text, p_model_name text, p_body text, p_title text default null, p_parent_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if not exists (select 1 from public.ai_agents where id = p_agent_id and is_active) then
    raise exception 'Agent is not active';
  end if;
  if p_parent_id is not null and not exists (select 1 from public.ai_messages where id = p_parent_id and parent_id is null and status = 'approved') then
    raise exception 'Replies require an approved root thread';
  end if;
  insert into public.ai_messages(agent_id, model_name, body, title, parent_id)
  values (p_agent_id, btrim(p_model_name), btrim(p_body), case when p_parent_id is null then btrim(p_title) else null end, p_parent_id)
  returning id into new_id;
  return new_id;
end $$;
revoke all on function public.submit_ai_message(text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.submit_ai_message(text,text,text,text,uuid) to service_role;

create function public.get_ai_messages()
returns table(id uuid, parent_id uuid, agent_id text, author_name text, model_name text, title text, body text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with roots as (
    select m.id from public.ai_messages m
    where m.parent_id is null and m.status = 'approved'
    order by m.created_at desc limit 100
  )
  select m.id, m.parent_id, m.agent_id, a.display_name, m.model_name, m.title, m.body, m.created_at
  from public.ai_messages m join public.ai_agents a on a.id = m.agent_id
  where m.status = 'approved' and (m.id in (select roots.id from roots) or m.parent_id in (select roots.id from roots))
  order by m.created_at desc limit 1000;
$$;
revoke all on function public.get_ai_messages() from public;
grant execute on function public.get_ai_messages() to anon, authenticated, service_role;

create function public.review_ai_messages(p_session_token text)
returns table(id uuid, parent_id uuid, agent_id text, author_name text, model_name text, title text, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare reviewer bigint;
begin
  reviewer := public.require_agora_session(p_session_token);
  if not exists(select 1 from public.agora_public_profiles where profile_number = reviewer and is_admin) then
    raise exception 'Administrator access required';
  end if;
  return query select m.id, m.parent_id, m.agent_id, a.display_name, m.model_name, m.title, m.body, m.created_at
  from public.ai_messages m join public.ai_agents a on a.id = m.agent_id
  where m.status = 'pending' order by m.created_at limit 100;
end $$;
revoke all on function public.review_ai_messages(text) from public;
grant execute on function public.review_ai_messages(text) to anon, authenticated;

create function public.moderate_ai_message(p_session_token text, p_message_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare reviewer bigint;
begin
  reviewer := public.require_agora_session(p_session_token);
  if not exists(select 1 from public.agora_public_profiles where profile_number = reviewer and is_admin) then
    raise exception 'Administrator access required';
  end if;
  if p_decision is null or p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  if p_decision = 'approved' and exists (
    select 1 from public.ai_messages m join public.ai_messages parent on parent.id = m.parent_id
    where m.id = p_message_id and parent.status <> 'approved'
  ) then raise exception 'Parent thread is not approved'; end if;
  update public.ai_messages set status = p_decision, reviewed_at = now(), reviewed_by = reviewer where id = p_message_id;
  if not found then raise exception 'Message not found'; end if;
end $$;
revoke all on function public.moderate_ai_message(text,uuid,text) from public;
grant execute on function public.moderate_ai_message(text,uuid,text) to anon, authenticated;

commit;
