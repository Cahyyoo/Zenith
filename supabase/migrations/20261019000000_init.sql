-- Zenith: initial schema
-- Single-user-per-account task manager. Every row is owned by auth.uid() and
-- protected by RLS. Primary keys are generated on the client so optimistic
-- (offline) rows keep their identity after sync.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.tag_color as enum (
  'slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink'
);
create type public.issue_type as enum ('feature', 'bug', 'chore', 'refactor');
create type public.issue_priority as enum ('low', 'medium', 'high', 'critical');
create type public.issue_status as enum ('backlog', 'todo', 'in_progress', 'done');

-- ---------------------------------------------------------------------------
-- Personal workspace
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color public.tag_color not null default 'slate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.personal_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text not null default '' check (char_length(notes) <= 5000),
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index personal_tasks_user_list_idx
  on public.personal_tasks (user_id, completed, due_date);

create table public.personal_task_tags (
  task_id uuid not null references public.personal_tasks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (task_id, tag_id)
);

create index personal_task_tags_tag_idx on public.personal_task_tags (tag_id);

create or replace function public.personal_tasks_set_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.completed and (tg_op = 'INSERT' or not old.completed) then
    new.completed_at = coalesce(new.completed_at, now());
  elsif not new.completed then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger personal_tasks_completed_at
  before insert or update of completed on public.personal_tasks
  for each row execute function public.personal_tasks_set_completed_at();

-- Replace the tag set of a task in one round trip (idempotent, safe to replay).
create or replace function public.set_task_tags(p_task_id uuid, p_tag_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.personal_task_tags
   where task_id = p_task_id
     and not (tag_id = any (p_tag_ids));
  insert into public.personal_task_tags (task_id, tag_id)
  select p_task_id, t
    from unnest(p_tag_ids) as t
  on conflict (task_id, tag_id) do nothing;
$$;

-- ---------------------------------------------------------------------------
-- Developer workspace
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  key text not null check (key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  description text not null default '' check (char_length(description) <= 2000),
  color public.tag_color not null default 'blue',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  number integer,
  title text not null check (char_length(title) between 1 and 200),
  description_md text not null default '' check (char_length(description_md) <= 50000),
  type public.issue_type not null default 'feature',
  priority public.issue_priority not null default 'medium',
  status public.issue_status not null default 'backlog',
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

create index issues_board_idx on public.issues (project_id, status, position);

-- Human-friendly per-project sequence (ZEN-1, ZEN-2, ...), assigned on sync.
create or replace function public.issues_assign_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.number is null then
    perform pg_advisory_xact_lock(hashtextextended(new.project_id::text, 0));
    select coalesce(max(i.number), 0) + 1
      into new.number
      from public.issues i
     where i.project_id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger issues_assign_number
  before insert on public.issues
  for each row execute function public.issues_assign_number();

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger tags_updated_at before update on public.tags
  for each row execute function public.set_updated_at();
create trigger personal_tasks_updated_at before update on public.personal_tasks
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger issues_updated_at before update on public.issues
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: every row belongs to exactly one user.
-- ---------------------------------------------------------------------------
alter table public.tags enable row level security;
alter table public.personal_tasks enable row level security;
alter table public.personal_task_tags enable row level security;
alter table public.projects enable row level security;
alter table public.issues enable row level security;

create policy "Owner full access" on public.tags
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owner full access" on public.personal_tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owner full access" on public.personal_task_tags
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.personal_tasks t
                 where t.id = task_id and t.user_id = (select auth.uid()))
    and exists (select 1 from public.tags g
                 where g.id = tag_id and g.user_id = (select auth.uid()))
  );

create policy "Owner full access" on public.projects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owner full access" on public.issues
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.projects p
                 where p.id = project_id and p.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Data API grants (explicit, signed-in users only)
-- ---------------------------------------------------------------------------
revoke all on public.tags, public.personal_tasks, public.personal_task_tags,
  public.projects, public.issues from anon;
grant select, insert, update, delete on public.tags, public.personal_tasks,
  public.personal_task_tags, public.projects, public.issues to authenticated;
revoke execute on function public.set_task_tags(uuid, uuid[]) from public, anon;
grant execute on function public.set_task_tags(uuid, uuid[]) to authenticated;
