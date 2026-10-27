import { check, unwrap } from "@/lib/api-error";
import { getSupabase } from "@/lib/supabase/client";
import { parseSchedule, type WorkSchedule } from "@/lib/work-schedule";

export type UserSettings = { workSchedule: WorkSchedule };

/** The user's settings; defaults apply when nothing is stored yet. */
export async function fetchSettings(): Promise<UserSettings> {
  const rows = unwrap(await getSupabase().from("user_settings").select("work_schedule").limit(1));
  return { workSchedule: parseSchedule(rows[0]?.work_schedule) };
}

/** Insert-or-update by user (one row per account); safe to replay. */
export async function saveWorkSchedule(schedule: WorkSchedule): Promise<void> {
  check(
    await getSupabase()
      .from("user_settings")
      .upsert({ work_schedule: schedule }, { onConflict: "user_id" }),
  );
}
