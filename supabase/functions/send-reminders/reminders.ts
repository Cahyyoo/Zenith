// Pure helpers for the send-reminders Edge Function (no Deno or npm imports,
// so they can be unit-tested with Vitest in the app).

export type DueReminder = {
  id: string;
  user_id: string;
  title: string;
  due_time: string | null;
  remind_at: string;
  remind_offset_minutes: number | null;
};

export type ReminderPayload = { title: string; body: string; tag: string; url: string };

/** Reminders this late are only marked as handled, never sent (e.g. after downtime). */
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export function isStale(reminder: Pick<DueReminder, "remind_at">, now: Date): boolean {
  return now.getTime() - Date.parse(reminder.remind_at) > STALE_AFTER_MS;
}

function formatOffset(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

/** Notification text: "Due now · 14:00" or "In 15 minutes · 14:00". */
export function buildPayload(reminder: DueReminder): ReminderPayload {
  const time = reminder.due_time ? reminder.due_time.slice(0, 5) : null;
  const offset = reminder.remind_offset_minutes ?? 0;
  const when = offset > 0 ? `In ${formatOffset(offset)}` : "Due now";
  return {
    title: reminder.title,
    body: time ? `${when} · ${time}` : when,
    tag: reminder.id,
    url: "/p",
  };
}

/** Push services answer 404/410 for subscriptions that no longer exist. */
export function isGoneStatus(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}
