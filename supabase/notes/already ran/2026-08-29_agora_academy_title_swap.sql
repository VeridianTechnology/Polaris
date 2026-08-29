-- Swap the Agora and Academy product names in the live database without copying data.
--
-- After this migration:
--   Agora   = the social board, profiles, posts, reactions, and anonymous mode.
--   Academy = Business, Finance, Politics, Crime, and Freedom research content.
--
-- Run once AFTER 2026-08-29_academy_numbered_profiles.sql.

begin;

do $$
begin
  if to_regclass('public.academy_public_profiles') is null
    or to_regclass('public.academy_comments') is null
    or to_regclass('public.academy_admin_ip_access') is null
    or to_regclass('public.academy_admin_sessions') is null
    or to_regclass('public.academy_managed_users') is null then
    raise exception 'Run 2026-08-29_academy_numbered_profiles.sql before this title-swap migration.';
  end if;

  if to_regclass('public.agora_issues') is null
    or to_regclass('public.agora_crime_entries') is null
    or to_regclass('public.agora_finance_entries') is null
    or to_regclass('public.agora_freedom_entries') is null then
    raise exception 'The existing Agora content migrations must be applied before this title-swap migration.';
  end if;

  if to_regclass('public.agora_public_profiles') is not null
    or to_regclass('public.academy_issues') is not null then
    raise exception 'The Agora/Academy title swap appears to have already been applied.';
  end if;
end;
$$;

-- The research library moves from the Agora prefix to the Academy prefix.
alter table public.agora_issues rename to academy_issues;
alter table public.agora_business_entries rename to academy_business_entries;
alter table public.agora_finance_entries rename to academy_finance_entries;
alter table public.agora_crime_entries rename to academy_crime_entries;
alter table public.agora_freedom_entries rename to academy_freedom_entries;
alter table public.agora_crime_comments rename to academy_crime_comments;
alter table public.agora_finance_comments rename to academy_finance_comments;
alter table public.agora_freedom_comments rename to academy_freedom_comments;

alter sequence public.agora_crime_comments_id_seq rename to academy_crime_comments_id_seq;
alter sequence public.agora_finance_comments_id_seq rename to academy_finance_comments_id_seq;
alter sequence public.agora_freedom_comments_id_seq rename to academy_freedom_comments_id_seq;

-- The social board moves from the Academy prefix to the Agora prefix.
alter table public.academy_public_profiles rename to agora_public_profiles;
alter table public.academy_comments rename to agora_comments;
alter table public.academy_comment_reactions rename to agora_comment_reactions;

alter sequence public.academy_comments_id_seq rename to agora_comments_id_seq;
alter sequence public.academy_public_profiles_profile_number_seq
  rename to agora_public_profiles_profile_number_seq;
alter sequence public.academy_post_number_seq rename to agora_post_number_seq;

alter table public.academy_admin_ip_access rename to agora_admin_ip_access;
alter table public.academy_admin_sessions rename to agora_admin_sessions;
alter table public.academy_managed_users rename to agora_managed_users;
alter sequence public.academy_managed_users_id_seq rename to agora_managed_users_id_seq;

alter view public.academy_comment_feed rename to agora_comment_feed;
alter view public.academy_profile_directory rename to agora_profile_directory;

-- Rename the public RPC surface. Existing grants remain attached to each function.
alter function public.react_to_academy_comment(bigint, uuid, text)
  rename to react_to_agora_comment;
alter function public.academy_visible_character_count(text)
  rename to agora_visible_character_count;
alter function public.sync_academy_public_profile()
  rename to sync_agora_public_profile;
alter function public.enforce_academy_global_post_cooldown()
  rename to enforce_agora_global_post_cooldown;
alter function public.assert_nyx_academy_owner(uuid)
  rename to assert_nyx_agora_owner;
alter function public.academy_nyx_post_status(uuid)
  rename to agora_nyx_post_status;
alter function public.create_nyx_academy_post(text, uuid)
  rename to create_nyx_agora_post;
alter function public.delete_nyx_academy_post(bigint, uuid)
  rename to delete_nyx_agora_post;
alter function public.get_nyx_academy_profile(uuid)
  rename to get_nyx_agora_profile;
alter function public.update_nyx_academy_profile(
  uuid, text, smallint, text, text, text, text, text, text, boolean, boolean
) rename to update_nyx_agora_profile;
alter function public.handle_new_academy_user()
  rename to handle_new_agora_user;
alter function public.record_academy_admin_attempt(inet, boolean)
  rename to record_agora_admin_attempt;

alter function public.set_agora_updated_at()
  rename to set_academy_updated_at;
alter function public.enforce_agora_media_comment_limit()
  rename to enforce_academy_media_comment_limit;

-- This older function is superseded by the unified media-limit trigger and should
-- not retain the old product name in the schema.
drop function if exists public.enforce_agora_crime_comment_limit();

alter trigger academy_public_profiles_set_updated_at
  on public.agora_public_profiles rename to agora_public_profiles_set_updated_at;
alter trigger profiles_sync_academy_public_profile
  on public.profiles rename to profiles_sync_agora_public_profile;
alter trigger academy_comments_set_updated_at
  on public.agora_comments rename to agora_comments_set_updated_at;
alter trigger academy_comment_reactions_set_updated_at
  on public.agora_comment_reactions rename to agora_comment_reactions_set_updated_at;
alter trigger academy_global_post_cooldown
  on public.agora_comments rename to agora_global_post_cooldown;
alter trigger academy_admin_ip_access_set_updated_at
  on public.agora_admin_ip_access rename to agora_admin_ip_access_set_updated_at;
alter trigger academy_managed_users_set_updated_at
  on public.agora_managed_users rename to agora_managed_users_set_updated_at;

alter trigger agora_issues_set_updated_at
  on public.academy_issues rename to academy_issues_set_updated_at;
alter trigger agora_business_entries_set_updated_at
  on public.academy_business_entries rename to academy_business_entries_set_updated_at;
alter trigger agora_finance_entries_set_updated_at
  on public.academy_finance_entries rename to academy_finance_entries_set_updated_at;
alter trigger agora_crime_entries_set_updated_at
  on public.academy_crime_entries rename to academy_crime_entries_set_updated_at;
alter trigger agora_freedom_entries_set_updated_at
  on public.academy_freedom_entries rename to academy_freedom_entries_set_updated_at;

-- PL/pgSQL source text is not rewritten when a table is renamed, so every social
-- function that names a table is recreated against the new Agora object names.
create or replace function public.sync_agora_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.agora_public_profiles (
    auth_user_id,
    username,
    display_name,
    avatar_index
  )
  values (new.id, new.username, new.display_name, new.avatar_index)
  on conflict (auth_user_id) do update
  set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_index = excluded.avatar_index;

  return new;
end;
$$;

create or replace function public.handle_new_agora_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
  generated_username text;
begin
  requested_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Agora Member'
  );

  generated_username := 'member_' || left(replace(new.id::text, '-', ''), 25);

  insert into public.profiles (id, username, display_name, avatar_index)
  values (
    new.id,
    generated_username,
    left(requested_name, 80),
    get_byte(uuid_send(new.id), 0) % 8
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.enforce_agora_global_post_cooldown()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null and exists (
    select 1
    from public.agora_comments as recent_post
    where recent_post.profile_number = new.profile_number
      and recent_post.parent_id is null
      and recent_post.deleted_at is null
      and recent_post.created_at > now() - interval '24 hours'
  ) then
    raise exception 'Global posting is limited to once every 24 hours';
  end if;

  return new;
end;
$$;

create or replace function public.react_to_agora_comment(
  p_comment_id bigint,
  p_voter_id uuid,
  p_reaction text
)
returns table (
  active_reaction text,
  likes_count integer,
  dislikes_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_reaction text;
begin
  if p_voter_id is null then
    raise exception 'A voter ID is required';
  end if;

  if p_reaction not in ('like', 'dislike') then
    raise exception 'Reaction must be like or dislike';
  end if;

  perform 1
  from public.agora_comments as comment
  where comment.id = p_comment_id
    and comment.deleted_at is null
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  select stored.reaction
  into existing_reaction
  from public.agora_comment_reactions as stored
  where stored.comment_id = p_comment_id
    and stored.voter_id = p_voter_id;

  if existing_reaction is null then
    insert into public.agora_comment_reactions (comment_id, voter_id, reaction)
    values (p_comment_id, p_voter_id, p_reaction);
    active_reaction := p_reaction;
  elsif existing_reaction = p_reaction then
    delete from public.agora_comment_reactions as stored
    where stored.comment_id = p_comment_id
      and stored.voter_id = p_voter_id;
    active_reaction := null;
  else
    update public.agora_comment_reactions as stored
    set reaction = p_reaction
    where stored.comment_id = p_comment_id
      and stored.voter_id = p_voter_id;
    active_reaction := p_reaction;
  end if;

  update public.agora_comments as comment
  set
    likes_count = (
      select count(*)::integer
      from public.agora_comment_reactions as stored
      where stored.comment_id = p_comment_id
        and stored.reaction = 'like'
    ),
    dislikes_count = (
      select count(*)::integer
      from public.agora_comment_reactions as stored
      where stored.comment_id = p_comment_id
        and stored.reaction = 'dislike'
    )
  where comment.id = p_comment_id
  returning comment.likes_count, comment.dislikes_count
  into likes_count, dislikes_count;

  return next;
end;
$$;

create or replace function public.assert_nyx_agora_owner(p_visitor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_owner uuid;
begin
  if p_visitor_id is null then
    raise exception 'A browser visitor ID is required';
  end if;

  select profile.owner_visitor_id
  into stored_owner
  from public.agora_public_profiles as profile
  where profile.profile_number = 1
  for update;

  if not found then
    raise exception 'NYX profile number 1 does not exist';
  end if;

  if stored_owner is null then
    update public.agora_public_profiles
    set owner_visitor_id = p_visitor_id
    where profile_number = 1;
  elsif stored_owner <> p_visitor_id then
    raise exception 'This browser does not own the NYX profile';
  end if;
end;
$$;

create or replace function public.agora_nyx_post_status(p_visitor_id uuid)
returns table (
  can_post boolean,
  next_post_at timestamptz,
  anonymous_mode boolean,
  is_owner boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with profile_state as (
    select
      profile.owner_visitor_id,
      profile.anonymous_mode
    from public.agora_public_profiles as profile
    where profile.profile_number = 1
  ), latest_post as (
    select max(comment.created_at) as created_at
    from public.agora_comments as comment
    where comment.profile_number = 1
      and comment.parent_id is null
      and comment.deleted_at is null
  )
  select
    (profile_state.owner_visitor_id is null or profile_state.owner_visitor_id = p_visitor_id)
      and (latest_post.created_at is null or latest_post.created_at <= now() - interval '24 hours'),
    case
      when latest_post.created_at is null then null
      else latest_post.created_at + interval '24 hours'
    end,
    profile_state.anonymous_mode,
    profile_state.owner_visitor_id is null or profile_state.owner_visitor_id = p_visitor_id
  from profile_state
  cross join latest_post;
$$;

create or replace function public.create_nyx_agora_post(
  p_body text,
  p_visitor_id uuid
)
returns setof public.agora_comment_feed
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_comment_id bigint;
  post_anonymously boolean;
begin
  perform public.assert_nyx_agora_owner(p_visitor_id);

  select profile.anonymous_mode
  into post_anonymously
  from public.agora_public_profiles as profile
  where profile.profile_number = 1;

  insert into public.agora_comments (
    user_id,
    guest_name,
    profile_number,
    body,
    is_anonymous,
    browser_author_id
  )
  values (
    null,
    'NYX',
    1,
    btrim(p_body),
    post_anonymously,
    p_visitor_id
  )
  returning id into new_comment_id;

  return query
  select feed.*
  from public.agora_comment_feed as feed
  where feed.id = new_comment_id;
end;
$$;

create or replace function public.delete_nyx_agora_post(
  p_post_number bigint,
  p_visitor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  perform public.assert_nyx_agora_owner(p_visitor_id);

  update public.agora_comments as comment
  set deleted_at = now()
  where comment.profile_number = 1
    and comment.post_number = p_post_number
    and comment.deleted_at is null
    and (comment.browser_author_id = p_visitor_id or comment.browser_author_id is null);

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

create or replace function public.get_nyx_agora_profile(p_visitor_id uuid)
returns table (
  profile_number bigint,
  username text,
  display_name text,
  avatar_index smallint,
  bio text,
  twitter_url text,
  instagram_url text,
  facebook_url text,
  snapchat_url text,
  email text,
  email_is_public boolean,
  anonymous_mode boolean,
  is_owner boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.profile_number,
    profile.username,
    profile.display_name,
    profile.avatar_index,
    profile.bio,
    profile.twitter_url,
    profile.instagram_url,
    profile.facebook_url,
    profile.snapchat_url,
    case
      when profile.owner_visitor_id is null or profile.owner_visitor_id = p_visitor_id
        then profile.email
      when profile.email_is_public then profile.email
      else null
    end,
    profile.email_is_public,
    profile.anonymous_mode,
    profile.owner_visitor_id is null or profile.owner_visitor_id = p_visitor_id
  from public.agora_public_profiles as profile
  where profile.profile_number = 1;
$$;

create or replace function public.update_nyx_agora_profile(
  p_visitor_id uuid,
  p_display_name text,
  p_avatar_index smallint,
  p_bio text,
  p_twitter_url text,
  p_instagram_url text,
  p_facebook_url text,
  p_snapchat_url text,
  p_email text,
  p_email_is_public boolean,
  p_anonymous_mode boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_nyx_agora_owner(p_visitor_id);

  update public.agora_public_profiles
  set
    display_name = left(btrim(p_display_name), 80),
    avatar_index = p_avatar_index,
    bio = coalesce(p_bio, ''),
    twitter_url = nullif(btrim(p_twitter_url), ''),
    instagram_url = nullif(btrim(p_instagram_url), ''),
    facebook_url = nullif(btrim(p_facebook_url), ''),
    snapchat_url = nullif(btrim(p_snapchat_url), ''),
    email = nullif(btrim(p_email), ''),
    email_is_public = coalesce(p_email_is_public, false),
    anonymous_mode = coalesce(p_anonymous_mode, false)
  where profile_number = 1;
end;
$$;

create or replace function public.record_agora_admin_attempt(
  p_ip_address inet,
  p_succeeded boolean
)
returns table (
  allowed boolean,
  locked boolean,
  attempts_remaining smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_row public.agora_admin_ip_access%rowtype;
  next_failed_attempts smallint;
  next_window_started_at timestamptz;
begin
  if p_ip_address is null then
    raise exception 'An IP address is required';
  end if;

  insert into public.agora_admin_ip_access (ip_address)
  values (p_ip_address)
  on conflict (ip_address) do nothing;

  select access.*
  into access_row
  from public.agora_admin_ip_access as access
  where access.ip_address = p_ip_address
  for update;

  if not access_row.is_enabled then
    return query select false, true, 0::smallint;
    return;
  end if;

  if p_succeeded then
    update public.agora_admin_ip_access as access
    set
      failed_attempts = 0,
      window_started_at = null,
      locked_at = null,
      last_attempt_at = now()
    where access.ip_address = p_ip_address;

    return query select true, false, 5::smallint;
    return;
  end if;

  if access_row.window_started_at is null
    or access_row.window_started_at < now() - interval '1 minute' then
    next_failed_attempts := 1;
    next_window_started_at := now();
  else
    next_failed_attempts := least(access_row.failed_attempts + 1, 5);
    next_window_started_at := access_row.window_started_at;
  end if;

  update public.agora_admin_ip_access as access
  set
    failed_attempts = next_failed_attempts,
    window_started_at = next_window_started_at,
    is_enabled = next_failed_attempts < 5,
    locked_at = case when next_failed_attempts >= 5 then now() else null end,
    last_attempt_at = now()
  where access.ip_address = p_ip_address;

  return query select
    false,
    next_failed_attempts >= 5,
    greatest(5 - next_failed_attempts, 0)::smallint;
end;
$$;

-- Compatibility aliases keep the already-deployed Edge Function operational until
-- its updated source is redeployed. The canonical base tables and function are Agora.
create view public.academy_admin_ip_access as
select * from public.agora_admin_ip_access;

create view public.academy_admin_sessions as
select * from public.agora_admin_sessions;

create view public.academy_managed_users as
select * from public.agora_managed_users;

create or replace function public.record_academy_admin_attempt(
  p_ip_address inet,
  p_succeeded boolean
)
returns table (
  allowed boolean,
  locked boolean,
  attempts_remaining smallint
)
language sql
security definer
set search_path = ''
as $$
  select *
  from public.record_agora_admin_attempt(p_ip_address, p_succeeded);
$$;

revoke all on table public.academy_admin_ip_access from public, anon, authenticated;
revoke all on table public.academy_admin_sessions from public, anon, authenticated;
revoke all on table public.academy_managed_users from public, anon, authenticated;
grant select, insert, update, delete on public.academy_admin_ip_access to service_role;
grant select, insert, update, delete on public.academy_admin_sessions to service_role;
grant select, insert, update, delete on public.academy_managed_users to service_role;

revoke all on function public.record_academy_admin_attempt(inet, boolean) from public;
grant execute on function public.record_academy_admin_attempt(inet, boolean) to service_role;

-- Rebuild the Academy media counter function because it stores table names as text.
create or replace function public.enforce_academy_media_comment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  entries_table text := tg_argv[0];
  target_issue text;
  target_item smallint;
  current_count smallint;
begin
  if entries_table not in (
    'public.academy_crime_entries',
    'public.academy_finance_entries',
    'public.academy_freedom_entries'
  ) then
    raise exception 'Unsupported Academy entry table';
  end if;

  if tg_op = 'INSERT' then
    target_issue := new.issue_key;

    if tg_table_name = 'academy_crime_comments' then
      target_item := new.crime_item_number;
    elsif tg_table_name = 'academy_finance_comments' then
      target_item := new.finance_item_number;
    elsif tg_table_name = 'academy_freedom_comments' then
      target_item := new.freedom_item_number;
    else
      raise exception 'Unsupported Academy comments table';
    end if;

    execute format(
      'select comments_count from %s where issue_key = $1 and item_number = $2 for update',
      entries_table
    )
    into current_count
    using target_issue, target_item;

    if current_count is null then
      raise foreign_key_violation using
        message = 'The requested Academy entry does not exist.';
    end if;

    if current_count >= 15 then
      raise check_violation using
        message = 'This discussion has reached its 15-comment limit.';
    end if;

    execute format(
      'update %s set comments_count = comments_count + 1 where issue_key = $1 and item_number = $2',
      entries_table
    )
    using target_issue, target_item;

    return new;
  end if;

  if tg_op = 'DELETE' then
    target_issue := old.issue_key;

    if tg_table_name = 'academy_crime_comments' then
      target_item := old.crime_item_number;
    elsif tg_table_name = 'academy_finance_comments' then
      target_item := old.finance_item_number;
    elsif tg_table_name = 'academy_freedom_comments' then
      target_item := old.freedom_item_number;
    else
      raise exception 'Unsupported Academy comments table';
    end if;

    execute format(
      'update %s set comments_count = greatest(comments_count - 1, 0) where issue_key = $1 and item_number = $2',
      entries_table
    )
    using target_issue, target_item;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_agora_media_comment_limit_before_insert
  on public.academy_crime_comments;
drop trigger if exists decrement_agora_media_comment_count_after_delete
  on public.academy_crime_comments;
create trigger enforce_academy_media_comment_limit_before_insert
before insert on public.academy_crime_comments
for each row execute function public.enforce_academy_media_comment_limit('public.academy_crime_entries');
create trigger decrement_academy_media_comment_count_after_delete
after delete on public.academy_crime_comments
for each row execute function public.enforce_academy_media_comment_limit('public.academy_crime_entries');

drop trigger if exists enforce_agora_media_comment_limit_before_insert
  on public.academy_finance_comments;
drop trigger if exists decrement_agora_media_comment_count_after_delete
  on public.academy_finance_comments;
create trigger enforce_academy_media_comment_limit_before_insert
before insert on public.academy_finance_comments
for each row execute function public.enforce_academy_media_comment_limit('public.academy_finance_entries');
create trigger decrement_academy_media_comment_count_after_delete
after delete on public.academy_finance_comments
for each row execute function public.enforce_academy_media_comment_limit('public.academy_finance_entries');

drop trigger if exists enforce_agora_media_comment_limit_before_insert
  on public.academy_freedom_comments;
drop trigger if exists decrement_agora_media_comment_count_after_delete
  on public.academy_freedom_comments;
create trigger enforce_academy_media_comment_limit_before_insert
before insert on public.academy_freedom_comments
for each row execute function public.enforce_academy_media_comment_limit('public.academy_freedom_entries');
create trigger decrement_academy_media_comment_count_after_delete
after delete on public.academy_freedom_comments
for each row execute function public.enforce_academy_media_comment_limit('public.academy_freedom_entries');

-- Rename the content policies users see in the Supabase dashboard.
do $$
declare
  policy_swap record;
begin
  for policy_swap in
    select *
    from (values
      ('academy_issues', 'Agora issues are publicly readable', 'Academy issues are publicly readable'),
      ('academy_business_entries', 'Agora business entries are publicly readable', 'Academy business entries are publicly readable'),
      ('academy_finance_entries', 'Agora finance entries are publicly readable', 'Academy finance entries are publicly readable'),
      ('academy_crime_entries', 'Agora crime entries are publicly readable', 'Academy crime entries are publicly readable'),
      ('academy_crime_comments', 'Agora crime comments are publicly readable', 'Academy crime comments are publicly readable'),
      ('academy_crime_comments', 'NYX can create Agora crime comments', 'NYX can create Academy crime comments'),
      ('academy_freedom_entries', 'Agora freedom entries are publicly readable', 'Academy freedom entries are publicly readable'),
      ('academy_finance_comments', 'Agora finance comments are publicly readable', 'Academy finance comments are publicly readable'),
      ('academy_finance_comments', 'NYX can create Agora finance comments', 'NYX can create Academy finance comments'),
      ('academy_freedom_comments', 'Agora freedom comments are publicly readable', 'Academy freedom comments are publicly readable'),
      ('academy_freedom_comments', 'NYX can create Agora freedom comments', 'NYX can create Academy freedom comments')
    ) as swaps(table_name, old_name, new_name)
  loop
    if exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = policy_swap.table_name
        and policyname = policy_swap.old_name
    ) then
      execute format(
        'alter policy %I on public.%I rename to %I',
        policy_swap.old_name,
        policy_swap.table_name,
        policy_swap.new_name
      );
    end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';

commit;
