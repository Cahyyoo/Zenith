-- Zenith: per-user settings, synced across devices.
-- `work_schedule` holds the working hours used to count Developer time:
-- an array of 7 days (Monday first) of { enabled, start: "HH:mm", end: "HH:mm" }.
-- The app validates the shape and falls back to Mon–Fri 09:00–17:00.

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  work_schedule jsonb not null,
  updated_at timestamptz not null default now(),
  constraint user_settings_schedule_is_week check (
    jsonb_typeof(work_schedule) = 'array' and jsonb_array_length(work_schedule) = 7
  )
);

create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "Owner full access" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.user_settings from anon;
grant select, insert, update, delete on public.user_settings to authenticated;
