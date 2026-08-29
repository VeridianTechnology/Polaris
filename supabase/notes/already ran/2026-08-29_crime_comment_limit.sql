-- Polaris Crime comment counter and hard 15-comment limit
-- Prepared August 29, 2026.
-- Run after 2026-08-29_agora_content_schema.sql.

begin;

alter table public.agora_crime_entries
  add column if not exists comments_count smallint not null default 0;

-- Synchronize the stored counter with comments that already exist.
update public.agora_crime_entries as entry
set comments_count = coalesce(existing.total, 0)::smallint
from (
  select
    crime.issue_key,
    crime.item_number,
    count(comment.id) as total
  from public.agora_crime_entries as crime
  left join public.agora_crime_comments as comment
    on comment.issue_key = crime.issue_key
    and comment.crime_item_number = crime.item_number
  group by crime.issue_key, crime.item_number
) as existing
where entry.issue_key = existing.issue_key
  and entry.item_number = existing.item_number;

do $$
begin
  if exists (
    select 1
    from public.agora_crime_entries
    where comments_count > 15
  ) then
    raise exception 'A Crime entry already contains more than 15 comments. Remove the excess comments before applying this migration.';
  end if;
end;
$$;

alter table public.agora_crime_entries
  drop constraint if exists agora_crime_entries_comments_count_check;

alter table public.agora_crime_entries
  add constraint agora_crime_entries_comments_count_check
  check (comments_count between 0 and 15);

create or replace function public.enforce_agora_crime_comment_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count smallint;
begin
  if tg_op = 'INSERT' then
    select entry.comments_count
    into current_count
    from public.agora_crime_entries as entry
    where entry.issue_key = new.issue_key
      and entry.item_number = new.crime_item_number
    for update;

    if not found then
      raise foreign_key_violation using
        message = 'The requested Crime entry does not exist.';
    end if;

    if current_count >= 15 then
      raise check_violation using
        message = 'This Crime discussion has reached its 15-comment limit.';
    end if;

    update public.agora_crime_entries as entry
    set comments_count = comments_count + 1
    where entry.issue_key = new.issue_key
      and entry.item_number = new.crime_item_number;

    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.agora_crime_entries as entry
    set comments_count = greatest(comments_count - 1, 0)
    where entry.issue_key = old.issue_key
      and entry.item_number = old.crime_item_number;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_agora_crime_comment_limit_before_insert
  on public.agora_crime_comments;
create trigger enforce_agora_crime_comment_limit_before_insert
before insert on public.agora_crime_comments
for each row execute function public.enforce_agora_crime_comment_limit();

drop trigger if exists decrement_agora_crime_comment_count_after_delete
  on public.agora_crime_comments;
create trigger decrement_agora_crime_comment_count_after_delete
after delete on public.agora_crime_comments
for each row execute function public.enforce_agora_crime_comment_limit();

revoke all on function public.enforce_agora_crime_comment_limit() from public;

commit;
