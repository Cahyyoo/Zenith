import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

/** Local calendar date as `yyyy-MM-dd` (due dates have no time or zone). */
export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(days: number, from: Date = new Date()): string {
  return toIsoDate(addDays(from, days));
}

export function parseIsoDate(value: string): Date {
  return parseISO(value);
}

export function formatDueDate(value: string, today: string = todayIso()): string {
  const days = differenceInCalendarDays(parseISO(value), parseISO(today));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  const date = parseISO(value);
  const sameYear = date.getFullYear() === parseISO(today).getFullYear();
  return format(date, sameYear ? "EEE, MMM d" : "MMM d, yyyy");
}
