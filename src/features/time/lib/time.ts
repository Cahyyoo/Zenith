import { addDays, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek } from "date-fns";

import type { TagColor } from "@/lib/domain";
import { workWindow, type WorkSchedule } from "@/lib/work-schedule";

/** A tracked work session for one task or issue. `end === null` means it is still running. */
export type Session = {
  id: string;
  itemId: string;
  start: number;
  end: number | null;
};

export type ItemInfo = {
  label: string;
  /** Secondary text, e.g. "ZEN-12" or a tag name. */
  meta?: string;
  color: TagColor;
  /** Grouping for summaries (project or tag). */
  groupKey: string;
  groupLabel: string;
};

export type Segment = { start: number; end: number; running: boolean };

export type DayItem = ItemInfo & { itemId: string; ms: number; segments: Segment[] };

export type DaySummary = {
  date: string;
  /** Real time worked that day: overlapping items count once. */
  totalMs: number;
  /** How much item time overlapped (sum of items minus the real total). */
  overlapMs: number;
  items: DayItem[];
};

export type GroupTotal = { key: string; label: string; color: TagColor; ms: number };

const toDateKey = (time: number) => format(time, "yyyy-MM-dd");

/** Splits a session at local midnight; a running session counts up to `now`. */
export function splitByDay(session: Session, now: number): { date: string; segment: Segment }[] {
  const running = session.end === null;
  // A session started moments ago (or with a slightly-ahead clock) still shows
  // up immediately as "<1m" instead of waiting for the next tick of `now`.
  const end = running ? Math.max(now, session.start + 1_000) : Math.max(session.start, session.end ?? session.start);
  const parts: { date: string; segment: Segment }[] = [];
  let cursor = session.start;

  while (cursor < end) {
    const nextMidnight = startOfDay(addDays(cursor, 1)).getTime();
    const partEnd = Math.min(end, nextMidnight);
    parts.push({ date: toDateKey(cursor), segment: { start: cursor, end: partEnd, running: running && partEnd === end } });
    cursor = partEnd;
  }
  return parts;
}

/**
 * Limits a same-day segment to that day's working window. Returns null when
 * nothing of it falls within working hours (day off, before/after hours).
 */
export function clipToSchedule(segment: Segment, schedule: WorkSchedule): Segment | null {
  const window = workWindow(schedule, segment.start);
  if (!window) return null;
  const start = Math.max(segment.start, window.start);
  const end = Math.min(segment.end, window.end);
  if (end <= start) return null;
  return { start, end, running: segment.running && end === segment.end };
}

/** Length of the union of intervals: overlapping time is counted once. */
export function unionMs(segments: readonly Pick<Segment, "start" | "end">[]): number {
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  let total = 0;
  let currentStart = -Infinity;
  let currentEnd = -Infinity;
  for (const { start, end } of sorted) {
    if (start > currentEnd) {
      if (currentEnd > currentStart) total += currentEnd - currentStart;
      currentStart = start;
      currentEnd = end;
    } else if (end > currentEnd) {
      currentEnd = end;
    }
  }
  if (currentEnd > currentStart) total += currentEnd - currentStart;
  return total;
}

/** Time of a session that falls within working hours (all of it without a schedule). */
export function sessionDuration(session: Session, now: number, schedule?: WorkSchedule): number {
  return splitByDay(session, now).reduce((sum, { segment }) => {
    const counted = schedule ? clipToSchedule(segment, schedule) : segment;
    return counted ? sum + (counted.end - counted.start) : sum;
  }, 0);
}

/**
 * Builds per-day summaries: what was worked on each date and for how long.
 * Each item keeps its full duration; the day total is real time, so items
 * worked on in parallel are not double-counted. With a `schedule`, only time
 * inside working hours counts. Items that can't be described are skipped.
 */
export function buildCalendar(
  sessions: readonly Session[],
  now: number,
  describe: (itemId: string) => ItemInfo | undefined,
  options: { schedule?: WorkSchedule } = {},
): Map<string, DaySummary> {
  const days = new Map<string, DaySummary>();

  for (const session of sessions) {
    const info = describe(session.itemId);
    if (!info) continue;
    for (const part of splitByDay(session, now)) {
      const segment = options.schedule ? clipToSchedule(part.segment, options.schedule) : part.segment;
      if (!segment) continue;
      const ms = segment.end - segment.start;
      if (ms <= 0) continue;
      const day = days.get(part.date) ?? { date: part.date, totalMs: 0, overlapMs: 0, items: [] };
      let item = day.items.find((candidate) => candidate.itemId === session.itemId);
      if (!item) {
        item = { ...info, itemId: session.itemId, ms: 0, segments: [] };
        day.items.push(item);
      }
      item.ms += ms;
      item.segments.push(segment);
      days.set(part.date, day);
    }
  }

  for (const day of days.values()) {
    day.items.sort((a, b) => b.ms - a.ms);
    for (const item of day.items) item.segments.sort((a, b) => a.start - b.start);
    day.totalMs = unionMs(day.items.flatMap((item) => item.segments));
    day.overlapMs = day.items.reduce((sum, item) => sum + item.ms, 0) - day.totalMs;
  }
  return days;
}

/**
 * Real time per group (project / tag) for the given days, largest first.
 * Overlap within a group on the same day is counted once.
 */
export function groupTotals(days: Iterable<DaySummary>): GroupTotal[] {
  const totals = new Map<string, GroupTotal>();
  for (const day of days) {
    const byGroup = new Map<string, DayItem[]>();
    for (const item of day.items) byGroup.set(item.groupKey, [...(byGroup.get(item.groupKey) ?? []), item]);
    for (const [key, items] of byGroup) {
      const first = items[0];
      if (!first) continue;
      const total = totals.get(key) ?? { key, label: first.groupLabel, color: first.color, ms: 0 };
      total.ms += unionMs(items.flatMap((item) => item.segments));
      totals.set(key, total);
    }
  }
  return [...totals.values()].sort((a, b) => b.ms - a.ms);
}

/** Calendar weeks (Monday first) covering the month of `month`, as `yyyy-MM-dd` keys. */
export function monthGrid(month: Date): string[][] {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const weeks: string[][] = [];
  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, offset) => toDateKey(addDays(cursor, offset).getTime())));
  }
  return weeks;
}

/** Time range (inclusive start, exclusive end) covered by `monthGrid(month)`. */
export function monthGridRange(month: Date): { from: string; to: string } {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const afterLast = addDays(endOfWeek(endOfMonth(month), { weekStartsOn: 1 }), 1);
  return { from: startOfDay(first).toISOString(), to: startOfDay(afterLast).toISOString() };
}

/** "<1m", "45m", "2h 05m". */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "<1m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

/** Compact form for calendar cells: "45m", "2.5h", "12h". */
export function formatHoursShort(ms: number): string {
  const minutes = ms / 60_000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  const hours = minutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${Math.round(hours * 10) / 10}h`;
}

/**
 * Adds a running session for items that are active locally (e.g. started
 * while offline) but have no open session from the server yet, so timers and
 * the calendar reflect a change before it syncs.
 */
export function mergeLocalRunning(
  sessions: readonly Session[],
  active: readonly { itemId: string; since: string | null }[],
): Session[] {
  const open = new Set(sessions.filter((session) => session.end === null).map((session) => session.itemId));
  const extra: Session[] = [];
  for (const { itemId, since } of active) {
    if (!since || open.has(itemId)) continue;
    extra.push({ id: `local-${itemId}`, itemId, start: Date.parse(since), end: null });
  }
  return extra.length > 0 ? [...sessions, ...extra] : [...sessions];
}

/**
 * Ends server sessions that are still open for items no longer active
 * locally (stopped offline, not yet synced), at the local change time.
 */
export function closeLocallyStopped(
  sessions: readonly Session[],
  stopped: ReadonlyMap<string, string | null>,
): Session[] {
  return sessions.map((session) => {
    if (session.end !== null || !stopped.has(session.itemId)) return session;
    const at = stopped.get(session.itemId);
    return { ...session, end: at ? Math.max(session.start, Date.parse(at)) : session.start };
  });
}
