// Supabase Edge Function: sends due task reminders as Web Push notifications.
// Called every minute by pg_cron (see supabase/setup/reminders-cron.sql).
//
// Secrets (supabase secrets set …):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com), CRON_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

import { buildPayload, isGoneStatus, isStale, type DueReminder } from "./reminders.ts";

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
}

const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
webpush.setVapidDetails(requireEnv("VAPID_SUBJECT"), requireEnv("VAPID_PUBLIC_KEY"), requireEnv("VAPID_PRIVATE_KEY"));
const cronSecret = requireEnv("CRON_SECRET");

type Subscription = { endpoint: string; p256dh: string; auth: string; user_id: string };

Deno.serve(async (request) => {
  if (request.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const { data: due, error } = await supabase
    .from("personal_tasks")
    .select("id, user_id, title, due_time, remind_at, remind_offset_minutes")
    .is("reminded_at", null)
    .eq("completed", false)
    .not("remind_at", "is", null)
    .lte("remind_at", now.toISOString())
    .order("remind_at", { ascending: true })
    .limit(500);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const reminders = (due ?? []) as DueReminder[];
  if (reminders.length === 0) return Response.json({ sent: 0 });

  const userIds = [...new Set(reminders.map((reminder) => reminder.user_id))];
  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", userIds);
  if (subsError) return Response.json({ error: subsError.message }, { status: 500 });

  const byUser = new Map<string, Subscription[]>();
  for (const sub of (subs ?? []) as Subscription[]) byUser.set(sub.user_id, [...(byUser.get(sub.user_id) ?? []), sub]);

  const gone = new Set<string>();
  let sent = 0;

  await Promise.all(
    reminders
      .filter((reminder) => !isStale(reminder, now))
      .flatMap((reminder) =>
        (byUser.get(reminder.user_id) ?? []).map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify(buildPayload(reminder)),
              { TTL: 60 * 60 },
            );
            sent += 1;
          } catch (sendError) {
            const statusCode = (sendError as { statusCode?: number }).statusCode;
            if (isGoneStatus(statusCode)) gone.add(sub.endpoint);
            else console.error("push failed", statusCode, sendError);
          }
        }),
      ),
  );

  // Mark handled — only if still due at this time, so a reminder rescheduled
  // in the meantime (which resets reminded_at) is not swallowed.
  const ids = reminders.map((reminder) => reminder.id);
  await supabase.from("personal_tasks").update({ reminded_at: now.toISOString() }).in("id", ids).lte("remind_at", now.toISOString());
  if (gone.size > 0) await supabase.from("push_subscriptions").delete().in("endpoint", [...gone]);

  return Response.json({ due: reminders.length, sent, removedSubscriptions: gone.size });
});
