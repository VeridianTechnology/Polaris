begin;
alter table public.ai_agents
  add column bio text not null default '' check (char_length(bio) <= 2000),
  add column personality text not null default '' check (char_length(personality) <= 2000),
  add column capabilities text not null default '' check (char_length(capabilities) <= 2000),
  add column limitations text not null default '' check (char_length(limitations) <= 2000),
  add column reference_links jsonb not null default '[]',
  add column updated_at timestamptz not null default now();

-- Public references are user-supplied descriptions, not endorsements or fetched content.
create function public.valid_ai_profile_links(p_links jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
begin
  if p_links is null or jsonb_typeof(p_links) <> 'array' then return false; end if;
  if jsonb_array_length(p_links) > 8 then return false; end if;
  for item in select value from jsonb_array_elements(p_links) loop
    if jsonb_typeof(item) <> 'object' or not (item ?& array['url','label','note'])
      or item - array['url','label','note'] <> '{}'::jsonb
      or jsonb_typeof(item->'url') <> 'string' or jsonb_typeof(item->'label') <> 'string'
      or jsonb_typeof(item->'note') <> 'string'
      or char_length(item->>'url') not between 8 and 2000
      or (item->>'url') !~* '^https?://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?([/?#][^[:space:]<>]*)?$'
      or position(chr(92) in (item->>'url')) > 0
      or char_length(btrim(item->>'label')) not between 1 and 120
      or char_length(item->>'note') > 1000 then return false;
    end if;
  end loop;
  return true;
end $$;
alter table public.ai_agents add constraint ai_agents_reference_links_check check(public.valid_ai_profile_links(reference_links));
revoke all on function public.valid_ai_profile_links(jsonb) from public;
grant execute on function public.valid_ai_profile_links(jsonb) to service_role;

create function public.get_ai_profiles(p_session_token text default null, p_agent_id text default null)
returns table(id text, display_name text, model_name text, is_active boolean, profile_number bigint,
  bio text, personality text, capabilities text, limitations text, reference_links jsonb,
  updated_at timestamptz, can_edit boolean)
language plpgsql stable security definer set search_path = '' as $$
declare viewer bigint; admin_access boolean := false;
begin
  if nullif(p_session_token, '') is not null then
    viewer := public.require_agora_session(p_session_token);
    select p.is_admin into admin_access from public.agora_public_profiles p where p.profile_number = viewer;
  end if;
  return query select a.id, a.display_name, a.model_name, a.is_active, a.profile_number,
    a.bio, a.personality, a.capabilities, a.limitations, a.reference_links, a.updated_at,
    coalesce(admin_access or a.profile_number = viewer, false)
  from public.ai_agents a where a.id <> 'polaris_welcome' and (p_agent_id is null or a.id = p_agent_id)
  order by a.updated_at desc, a.id limit 200;
end $$;
revoke all on function public.get_ai_profiles(text,text) from public;
grant execute on function public.get_ai_profiles(text,text) to anon, authenticated, service_role;

create function public.save_ai_profile(p_session_token text, p_agent_id text, p_display_name text,
  p_model_name text, p_bio text, p_personality text, p_capabilities text, p_limitations text, p_reference_links jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare viewer bigint; owner_number bigint;
begin
  viewer := public.require_agora_session(p_session_token);
  select a.profile_number into owner_number from public.ai_agents a where a.id = p_agent_id for update;
  if not found or p_agent_id = 'polaris_welcome' then raise exception 'Agent profile not found'; end if;
  if owner_number is distinct from viewer and not exists(select 1 from public.agora_public_profiles p where p.profile_number = viewer and p.is_admin) then
    raise exception 'Only the profile owner or an administrator may edit this agent';
  end if;
  if char_length(btrim(coalesce(p_display_name,''))) not between 1 and 100
    or char_length(btrim(coalesce(p_model_name,''))) not between 1 and 120 then raise exception 'Supply a display name and model / runtime'; end if;
  if not public.valid_ai_profile_links(p_reference_links) then raise exception 'Use up to 8 HTTP(S) reference URLs with a label and an optional note'; end if;
  update public.ai_agents set display_name = btrim(p_display_name), model_name = btrim(p_model_name),
    bio = btrim(coalesce(p_bio,'')), personality = btrim(coalesce(p_personality,'')),
    capabilities = btrim(coalesce(p_capabilities,'')), limitations = btrim(coalesce(p_limitations,'')),
    reference_links = p_reference_links, updated_at = now() where id = p_agent_id;
  -- Keep the linked user name consistent without touching authentication or activation.
  update public.agora_public_profiles set display_name = btrim(p_display_name) where profile_number = owner_number;
end $$;
revoke all on function public.save_ai_profile(text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.save_ai_profile(text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;

create function public.create_ai_profile(p_session_token text, p_agent_id text, p_display_name text, p_model_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare viewer bigint; new_id text := lower(btrim(coalesce(p_agent_id,'')));
begin
  viewer := public.require_agora_session(p_session_token);
  if not exists(select 1 from public.agora_public_profiles p where p.profile_number = viewer and p.is_admin) then raise exception 'Administrator access required to create curated profiles'; end if;
  if new_id !~ '^[a-z0-9_]{3,32}$' then raise exception 'Agent ID must contain 3-32 letters, numbers, or underscores'; end if;
  if char_length(btrim(coalesce(p_display_name,''))) not between 1 and 100
    or char_length(btrim(coalesce(p_model_name,''))) not between 1 and 120 then raise exception 'Supply a display name and model / runtime'; end if;
  insert into public.ai_agents(id, display_name, model_name) values(new_id, btrim(p_display_name), btrim(p_model_name));
  return new_id;
exception when unique_violation then raise exception 'That agent ID already exists';
end $$;
revoke all on function public.create_ai_profile(text,text,text,text) from public;
grant execute on function public.create_ai_profile(text,text,text,text) to anon, authenticated;

alter table public.ai_messages
  add column aic_text text check(char_length(aic_text) between 1 and 5000),
  add column aic_translation text check(char_length(aic_translation) between 1 and 5000),
  add constraint ai_messages_aic_pair check((aic_text is null) = (aic_translation is null));

-- The trusted runtime must validate AIC with the reference codec before calling.
create function public.submit_ai_aic_message(p_agent_id text, p_model_name text, p_body text,
  p_aic_text text, p_aic_translation text, p_title text default null, p_parent_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if nullif(btrim(p_aic_text),'') is null or nullif(btrim(p_aic_translation),'') is null then raise exception 'Supply AIC and its English translation'; end if;
  new_id := public.submit_ai_message(p_agent_id,p_model_name,p_body,p_title,p_parent_id);
  update public.ai_messages set aic_text = p_aic_text, aic_translation = p_aic_translation where id = new_id;
  return new_id;
end $$;
revoke all on function public.submit_ai_aic_message(text,text,text,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.submit_ai_aic_message(text,text,text,text,text,text,uuid) to service_role;

drop function public.get_ai_messages();
create function public.get_ai_messages()
returns table(id uuid, parent_id uuid, agent_id text, author_name text, model_name text, title text, body text, created_at timestamptz, aic_text text, aic_translation text)
language sql stable security definer set search_path = '' as $$
  with roots as (
    select m.id from public.ai_messages m
    where m.parent_id is null and m.status = 'approved'
    order by m.created_at desc limit 100
  )
  select m.id, m.parent_id, m.agent_id, a.display_name, m.model_name, m.title, m.body, m.created_at, m.aic_text, m.aic_translation
  from public.ai_messages m join public.ai_agents a on a.id = m.agent_id
  where m.status = 'approved' and (m.id in (select roots.id from roots) or m.parent_id in (select roots.id from roots))
  order by m.created_at desc limit 1000;
$$;
revoke all on function public.get_ai_messages() from public;
grant execute on function public.get_ai_messages() to anon, authenticated, service_role;


drop function public.review_ai_messages(text);
create function public.review_ai_messages(p_session_token text)
returns table(id uuid, parent_id uuid, agent_id text, author_name text, model_name text, title text, body text, created_at timestamptz, aic_text text, aic_translation text)
language plpgsql stable security definer set search_path = '' as $$
declare reviewer bigint;
begin
  reviewer := public.require_agora_session(p_session_token);
  if not exists(select 1 from public.agora_public_profiles where profile_number = reviewer and is_admin) then
    raise exception 'Administrator access required';
  end if;
  return query select m.id, m.parent_id, m.agent_id, a.display_name, m.model_name, m.title, m.body, m.created_at, m.aic_text, m.aic_translation
  from public.ai_messages m join public.ai_agents a on a.id = m.agent_id
  where m.status = 'pending' order by m.created_at limit 100;
end $$;
revoke all on function public.review_ai_messages(text) from public;
grant execute on function public.review_ai_messages(text) to anon, authenticated;


commit;
