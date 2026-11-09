import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarWeeks,
  format,
  getDaysInMonth,
  parseISO,
  setDate,
  startOfWeek,
} from "date-fns";
import { z } from "zod";

import { WEEKDAY_LABELS } from "@/lib/work-schedule";

/**
 * How a personal task repeats. Occurrences follow a fixed schedule from the
 * due date (not from when the task was completed).
 */
export const recurrenceSchema = z.object({
  freq: z.enum(["day", "week", "month", "year"]),
  interval: z.number().int().min(1).max(365),
  /** Weekly only: days of the week, Monday = 0 … Sunday = 6. */
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  /** Monthly only: the intended day of the month, so short months don't shift it. */
  anchorDay: z.number().int().min(1).max(31).optional(),
});
export type Recurrence = z.infer<typeof recurrenceSchema>;

/** Parses stored JSON; anything invalid means "does not repeat". */
export function parseRecurrence(value: unknown): Recurrence | null {
  const result = recurrenceSchema.safeParse(value);
  return result.success ? result.data : null;
}

const toKey = (date: Date) => format(date, "yyyy-MM-dd");
const weekdayOf = (date: Date) => (date.getDay() + 6) % 7;

/** The occurrence right after `date` (ignoring today). */
function step(rule: Recurrence, date: Date, anchor: Date): Date {
  switch (rule.freq) {
    case "day":
      return addDays(date, rule.interval);
    case "year":
      // Always offset from the anchor so a Feb 29 task returns to Feb 29 in leap years.
      return addYears(anchor, date.getFullYear() - anchor.getFullYear() + rule.interval);
    case "month": {
      const next = addMonths(setDate(date, 1), rule.interval);
      const day = rule.anchorDay ?? anchor.getDate();
      return setDate(next, Math.min(day, getDaysInMonth(next)));
    }
    case "week": {
      const weekdays = rule.weekdays && rule.weekdays.length > 0 ? rule.weekdays : [weekdayOf(anchor)];
      const anchorWeek = startOfWeek(anchor, { weekStartsOn: 1 });
      // Scan forward day by day; at most `interval` weeks plus one week ahead.
      for (let cursor = addDays(date, 1), i = 0; i < 7 * (rule.interval + 1); cursor = addDays(cursor, 1), i += 1) {
        const weeks = differenceInCalendarWeeks(cursor, anchorWeek, { weekStartsOn: 1 });
        if (weeks % rule.interval === 0 && weekdays.includes(weekdayOf(cursor))) return cursor;
      }
      return addDays(date, 7 * rule.interval);
    }
  }
}

/**
 * The next due date after completing (or skipping) the occurrence due on
 * `dueDate`: the first scheduled date after it that is not already past.
 */
export function nextDueDate(rule: Recurrence, dueDate: string, today: string): string {
  const anchor = parseISO(dueDate);
  let cursor = step(rule, anchor, anchor);
  // Jump over occurrences that are already in the past (bounded for safety).
  for (let i = 0; i < 5000 && toKey(cursor) < today; i += 1) cursor = step(rule, cursor, anchor);
  return toKey(cursor);
}

/** Future occurrences after `dueDate` that fall within [from, to] (inclusive), for calendars. */
export function occurrencesBetween(rule: Recurrence, dueDate: string, from: string, to: string, limit = 62): string[] {
  const anchor = parseISO(dueDate);
  const dates: string[] = [];
  for (let cursor = step(rule, anchor, anchor), i = 0; i < 5000 && dates.length < limit; cursor = step(rule, cursor, anchor), i += 1) {
    const key = toKey(cursor);
    if (key > to) break;
    if (key >= from) dates.push(key);
  }
  return dates;
}

const UNIT: Record<Recurrence["freq"], [string, string]> = {
  day: ["day", "days"],
  week: ["week", "weeks"],
  month: ["month", "months"],
  year: ["year", "years"],
};

/** "Every day", "Every 2 days", "Every week on Mon, Thu", "Every 2 months", "Every year". */
export function describeRecurrence(rule: Recurrence): string {
  const [one, many] = UNIT[rule.freq];
  const base = rule.interval === 1 ? `Every ${one}` : `Every ${rule.interval} ${many}`;
  if (rule.freq === "week" && rule.weekdays && rule.weekdays.length > 0) {
    const days = [...rule.weekdays].sort((a, b) => a - b).map((day) => WEEKDAY_LABELS[day]);
    return `${base} on ${days.join(", ")}`;
  }
  return base;
}

/** Short badge label: "Daily", "2 days", "Weekly", "2 weeks", "Monthly", "Yearly". */
export function shortRecurrence(rule: Recurrence): string {
  if (rule.interval === 1) return { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" }[rule.freq];
  return `${rule.interval} ${UNIT[rule.freq][1]}`;
}

/**
 * When to send the reminder: due date + due time − offset, in this device's
 * timezone. No time or no offset means no reminder.
 */
export function computeRemindAt(dueDate: string | null, dueTime: string | null, offsetMinutes: number | null): string | null {
  if (!dueDate || !dueTime || offsetMinutes === null) return null;
  const [year, month, day] = dueDate.split("-").map(Number);
  const [hours, minutes] = dueTime.split(":").map(Number);
  if (!year || !month || !day || hours === undefined || minutes === undefined) return null;
  const at = new Date(year, month - 1, day, hours, minutes);
  return new Date(at.getTime() - offsetMinutes * 60_000).toISOString();
}
