-- Zenith: recurring personal tasks, due times and push reminders.
--
-- The client computes `remind_at` (due date + due time − offset, in the
-- device's timezone), so reminders are correct without the server knowing
-- the user's timezone and are scheduled even when created offline.
-- The `send-reminders` Edge Function sends due reminders and stamps
-- `reminded_at`.

alter table public.personal_tasks
  add column due_time time,
  add column recurrence jsonb,
  add column remind_offset_minutes integer,
  add column remind_at timestamptz,
  add column reminded_at timestamptz,
  add constraint personal_tasks_recurrence_is_object
    check (recurrence is null or jsonb_typeof(recurrence) = 'object'),
  add constraint personal_tasks_recurrence_needs_due_date
    check (recurrence is null or due_date is not null),
  add constraint personal_tasks_remind_offset_range
    check (remind_offset_minutes is null or remind_offset_minutes between 0 and 10080);

-- Pending reminders, scanned every minute by the Edge Function.
create index personal_tasks_pending_reminders_idx
  on public.personal_tasks (remind_at)
  where reminded_at is null and completed = false and remind_at is not null;

-- Rescheduling a reminder (new due date/time, skip, next occurrence) makes it
-- eligible to be sent again.
create or replace function public.personal_tasks_reset_reminder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.remind_at is distinct from old.remind_at then
    new.reminded_at := null;
  end if;
  return new;
end;
$$;

create trigger personal_tasks_reset_reminder
  before update of remind_at on public.personal_tasks
  for each row execute function public.personal_tasks_reset_reminder();

-- Web Push subscriptions, one per browser/device.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Owner full access" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
