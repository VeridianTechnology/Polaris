-- Temporary NYX guest posting and browser-scoped Academy reactions.
-- Run this once after academy_schema.sql in the Supabase SQL Editor.
-- Replace this guest policy with authenticated user policies before production.

begin;

alter table public.academy_comments
  alter column user_id drop not null;

alter table public.academy_comments
  add column if not exists guest_name text,
  add column if not exists likes_count integer not null default 0
    check (likes_count >= 0),
  add column if not exists dislikes_count integer not null default 0
    check (dislikes_count >= 0);

alter table public.academy_comments
  drop constraint if exists academy_comments_author_check;

alter table public.academy_comments
  add constraint academy_comments_author_check
  check (
    user_id is not null
    or (user_id is null and guest_name = 'NYX')
  );

create table if not exists public.academy_comment_reactions (
  comment_id bigint not null
    references public.academy_comments(id) on delete cascade,
  voter_id uuid not null,
  reaction text not null
    check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comment_id, voter_id)
);

alter table public.academy_comment_reactions enable row level security;

drop trigger if exists academy_comment_reactions_set_updated_at
  on public.academy_comment_reactions;
create trigger academy_comment_reactions_set_updated_at
before update on public.academy_comment_reactions
for each row execute function public.set_updated_at();

drop policy if exists "NYX can create guest comments"
  on public.academy_comments;
create policy "NYX can create guest comments"
on public.academy_comments
for insert
to anon
with check (
  user_id is null
  and guest_name = 'NYX'
  and deleted_at is null
);

create or replace function public.react_to_academy_comment(
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
  from public.academy_comments as comment
  where comment.id = p_comment_id
    and comment.deleted_at is null
  for update;

  if not found then
    raise exception 'Comment not found';
  end if;

  select stored.reaction
  into existing_reaction
  from public.academy_comment_reactions as stored
  where stored.comment_id = p_comment_id
    and stored.voter_id = p_voter_id;

  if existing_reaction is null then
    insert into public.academy_comment_reactions (comment_id, voter_id, reaction)
    values (p_comment_id, p_voter_id, p_reaction);
    active_reaction := p_reaction;
  elsif existing_reaction = p_reaction then
    delete from public.academy_comment_reactions as stored
    where stored.comment_id = p_comment_id
      and stored.voter_id = p_voter_id;
    active_reaction := null;
  else
    update public.academy_comment_reactions as stored
    set reaction = p_reaction
    where stored.comment_id = p_comment_id
      and stored.voter_id = p_voter_id;
    active_reaction := p_reaction;
  end if;

  update public.academy_comments as comment
  set
    likes_count = (
      select count(*)::integer
      from public.academy_comment_reactions as stored
      where stored.comment_id = p_comment_id
        and stored.reaction = 'like'
    ),
    dislikes_count = (
      select count(*)::integer
      from public.academy_comment_reactions as stored
      where stored.comment_id = p_comment_id
        and stored.reaction = 'dislike'
    )
  where comment.id = p_comment_id
  returning comment.likes_count, comment.dislikes_count
  into likes_count, dislikes_count;

  return next;
end;
$$;

grant insert (parent_id, body, guest_name)
  on public.academy_comments to anon;
grant usage, select
  on sequence public.academy_comments_id_seq to anon;

revoke all on table public.academy_comment_reactions from anon, authenticated;
revoke all on function public.react_to_academy_comment(bigint, uuid, text) from public;
grant execute on function public.react_to_academy_comment(bigint, uuid, text)
  to anon, authenticated;

commit;
