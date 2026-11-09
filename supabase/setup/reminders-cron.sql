-- Zenith: run the send-reminders Edge Function every minute.
-- Run this once in the Supabase SQL Editor AFTER deploying the function
-- (see README → "Reminders (push notifications)").
--
-- Replace <CRON_SECRET> with the same value you set via
--   supabase secrets set CRON_SECRET=...
-- The function URL below already points at this project.

-- 1. Scheduler and HTTP client.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Keep the URL and secret in Vault instead of in the job definition.
select vault.create_secret(
  'https://cebhqiviyjvwqglpwogy.supabase.co/functions/v1/send-reminders',
  'zenith_reminders_url'
);
select vault.create_secret('<CRON_SECRET>', 'zenith_reminders_secret');

-- 3. Every minute, ask the function to send due reminders.
select cron.schedule(
  'zenith-send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'zenith_reminders_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'zenith_reminders_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Check runs:   select * from cron.job_run_details order by start_time desc limit 10;
-- Stop it:      select cron.unschedule('zenith-send-reminders');
