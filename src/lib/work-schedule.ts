import { z } from "zod";

/**
 * Working hours used to count Developer time. Seven days, Monday first,
 * each with an optional window in local time ("HH:mm").
 */
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
// "24:00" lets a day run until midnight.
const endTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, "Use HH:mm");

export const workDaySchema = z
  .object({ enabled: z.boolean(), start: time, end: endTime })
  .refine((day) => !day.enabled || day.end > day.start, { message: "End must be after start", path: ["end"] });
export type WorkDay = z.infer<typeof workDaySchema>;

export const workScheduleSchema = z.array(workDaySchema).length(7);
export type WorkSchedule = z.infer<typeof workScheduleSchema>;

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function week(days: readonly boolean[], start: string, end: string): WorkSchedule {
  return days.map((enabled) => ({ enabled, start, end }));
}

const WEEKDAYS = [true, true, true, true, true, false, false];
const EVERY_DAY = [true, true, true, true, true, true, true];

export const DEFAULT_SCHEDULE: WorkSchedule = week(WEEKDAYS, "09:00", "17:00");

export const SCHEDULE_PRESETS: { label: string; schedule: WorkSchedule }[] = [
  { label: "Mon–Fri 09–17", schedule: DEFAULT_SCHEDULE },
  { label: "Mon–Fri 08–17", schedule: week(WEEKDAYS, "08:00", "17:00") },
  { label: "Every day 09–17", schedule: week(EVERY_DAY, "09:00", "17:00") },
];

/** Parses stored JSON, falling back to the default for missing or invalid data. */
export function parseSchedule(value: unknown): WorkSchedule {
  const result = workScheduleSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_SCHEDULE;
}

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export function hoursPerWeek(schedule: WorkSchedule): number {
  return schedule.reduce((sum, day) => sum + (day.enabled ? (minutes(day.end) - minutes(day.start)) / 60 : 0), 0);
}

/** Monday = 0 … Sunday = 6 for a JS Date (whose getDay() is Sunday = 0). */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** The working window of the local day containing `time`, or null on a day off. */
export function workWindow(schedule: WorkSchedule, time: number): { start: number; end: number } | null {
  const date = new Date(time);
  const day = schedule[weekdayIndex(date)];
  if (!day?.enabled) return null;
  const at = (hhmm: string) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(hhmm.slice(0, 2)), Number(hhmm.slice(3, 5))).getTime();
  return { start: at(day.start), end: at(day.end) };
}

/** Short human summary, e.g. "Mon–Fri 09:00–17:00" or "Custom (38h/week)". */
export function describeSchedule(schedule: WorkSchedule): string {
  const enabled = schedule.map((day, index) => ({ ...day, index })).filter((day) => day.enabled);
  if (enabled.length === 0) return "No working days";
  const first = enabled[0];
  const uniform = first && enabled.every((day) => day.start === first.start && day.end === first.end);
  const contiguous = enabled.every((day, i) => i === 0 || day.index === (enabled[i - 1]?.index ?? -2) + 1);
  if (first && uniform && contiguous) {
    const last = enabled[enabled.length - 1] ?? first;
    const days = first.index === last.index ? WEEKDAY_LABELS[first.index] : `${WEEKDAY_LABELS[first.index]}–${WEEKDAY_LABELS[last.index]}`;
    return `${days} ${first.start}–${first.end}`;
  }
  return `Custom (${Math.round(hoursPerWeek(schedule) * 10) / 10}h/week)`;
}
