-- Zenith: automatic time tracking driven by status changes.
--
-- Clients send `status_changed_at` (the device time of the change) together
-- with every status change. That value travels inside the offline write queue,
-- so changes made offline are recorded with the time they actually happened.
-- Triggers turn status transitions into sessions in `time_entries`:
--   issues:          a session runs while status = 'in_progress'
--   personal_tasks:  a session runs while doing = true and completed = false

alter table public.issues
  add column status_changed_at timestamptz;

alter table public.personal_tasks
  add column doing boolean not null default false,
  add column status_changed_at timestamptz;

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid references public.personal_tasks (id) on delete cascade,
  issue_id uuid references public.issues (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint time_entries_one_parent check (num_nonnulls(task_id, issue_id) = 1),
  constraint time_entries_valid_range check (ended_at is null or ended_at >= started_at)
);

create index time_entries_user_started_idx on public.time_entries (user_id, started_at);
create index time_entries_issue_idx on public.time_entries (issue_id) where issue_id is not null;
create index time_entries_task_idx on public.time_entries (task_id) where task_id is not null;
-- At most one running session per item.
create unique index time_entries_open_issue_idx
  on public.time_entries (issue_id) where ended_at is null and issue_id is not null;
create unique index time_entries_open_task_idx
  on public.time_entries (task_id) where ended_at is null and task_id is not null;

-- The moment a status change happened: the client-supplied time when it sent
-- one with this change, otherwise the server time. Never in the future.
create or replace function public.status_change_time(
  new_at timestamptz,
  old_at timestamptz,
  is_insert boolean
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select least(
    case
      when new_at is not null and (is_insert or new_at is distinct from old_at) then new_at
      else now()
    end,
    now()
  );
$$;

create or replace function public.issues_track_time()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  was_active boolean := false;
  is_active boolean := new.status = 'in_progress';
  old_at timestamptz;
  at timestamptz;
begin
  -- OLD is only read for updates (it does not exist for inserts).
  if tg_op = 'UPDATE' then
    was_active := old.status = 'in_progress';
    old_at := old.status_changed_at;
  end if;

  if was_active = is_active then
    return null;
  end if;

  at := public.status_change_time(new.status_changed_at, old_at, tg_op = 'INSERT');

  if was_active then
    update public.time_entries
       set ended_at = greatest(at, started_at)
     where issue_id = new.id and ended_at is null;
  end if;

  if is_active then
    insert into public.time_entries (user_id, issue_id, started_at)
    values (new.user_id, new.id, at)
    on conflict (issue_id) where ended_at is null and issue_id is not null do nothing;
  end if;

  return null;
end;
$$;

create trigger issues_track_time
  after insert or update of status on public.issues
  for each row execute function public.issues_track_time();

create or replace function public.personal_tasks_track_time()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  was_active boolean := false;
  is_active boolean := new.doing and not new.completed;
  old_at timestamptz;
  at timestamptz;
begin
  -- OLD is only read for updates (it does not exist for inserts).
  if tg_op = 'UPDATE' then
    was_active := old.doing and not old.completed;
    old_at := old.status_changed_at;
  end if;

  if was_active = is_active then
    return null;
  end if;

  at := public.status_change_time(new.status_changed_at, old_at, tg_op = 'INSERT');

  if was_active then
    update public.time_entries
       set ended_at = greatest(at, started_at)
     where task_id = new.id and ended_at is null;
  end if;

  if is_active then
    insert into public.time_entries (user_id, task_id, started_at)
    values (new.user_id, new.id, at)
    on conflict (task_id) where ended_at is null and task_id is not null do nothing;
  end if;

  return null;
end;
$$;

create trigger personal_tasks_track_time
  after insert or update of doing, completed on public.personal_tasks
  for each row execute function public.personal_tasks_track_time();

-- Row Level Security: owner only, and the parent item must be the owner's too.
alter table public.time_entries enable row level security;

create policy "Owner full access" on public.time_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      (issue_id is not null and exists (
        select 1 from public.issues i where i.id = issue_id and i.user_id = (select auth.uid())))
      or
      (task_id is not null and exists (
        select 1 from public.personal_tasks t where t.id = task_id and t.user_id = (select auth.uid())))
    )
  );

revoke all on public.time_entries from anon;
grant select, insert, update, delete on public.time_entries to authenticated;
revoke execute on function public.status_change_time(timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.status_change_time(timestamptz, timestamptz, boolean) to authenticated;

-- Backfill: issues already in progress get an open session from their last
-- update, so current work shows up in the calendar immediately. The insert
-- runs first because the update below bumps `updated_at`.
insert into public.time_entries (user_id, issue_id, started_at)
select user_id, id, updated_at from public.issues where status = 'in_progress'
on conflict (issue_id) where ended_at is null and issue_id is not null do nothing;

update public.issues set status_changed_at = updated_at where status = 'in_progress';
