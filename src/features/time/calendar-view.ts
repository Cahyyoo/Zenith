"use client";

import { format, isSameMonth, parseISO } from "date-fns";
import { useMemo, useState } from "react";

import type { CalendarDay } from "@/components/calendar/month-calendar";
import { todayIso } from "@/lib/dates";
import type { WorkSchedule } from "@/lib/work-schedule";

import { toSession, type EntryRow } from "./api";
import {
  buildCalendar,
  closeLocallyStopped,
  formatHoursShort,
  groupTotals,
  mergeLocalRunning,
  monthGrid,
  monthGridRange,
  type DaySummary,
  type GroupTotal,
  type ItemInfo,
} from "./lib/time";

/** Visible month, selected day and the date range to fetch. */
export function useMonthState() {
  const [today] = useState(todayIso);
  const [month, setMonth] = useState(() => parseISO(today));
  const [selected, setSelected] = useState(today);
  const weeks = useMemo(() => monthGrid(month), [month]);
  const range = useMemo(() => monthGridRange(month), [month]);
  return { today, month, setMonth, selected, setSelected, weeks, range };
}

export type LocalItemState = {
  itemId: string;
  /** Whether time is running for this item in the local (possibly unsynced) cache. */
  active: boolean;
  statusChangedAt: string | null;
};

export type TimeView = {
  days: Map<string, DaySummary>;
  cells: Map<string, CalendarDay>;
  groups: GroupTotal[];
  totalMs: number;
  activeDays: number;
};

/**
 * Combines server sessions with local state (changes not synced yet) and
 * turns them into calendar cells plus month totals.
 */
export function buildTimeView(input: {
  rows: readonly EntryRow[];
  local: readonly LocalItemState[];
  describe: (itemId: string) => ItemInfo | undefined;
  now: number;
  month: Date;
  /** Count only time inside these working hours (Developer). */
  schedule?: WorkSchedule;
}): TimeView {
  const stopped = new Map(
    input.local.filter((item) => !item.active).map((item) => [item.itemId, item.statusChangedAt] as const),
  );
  const sessions = mergeLocalRunning(
    closeLocallyStopped(input.rows.map(toSession), stopped),
    input.local.filter((item) => item.active).map((item) => ({ itemId: item.itemId, since: item.statusChangedAt })),
  );
  const days = buildCalendar(sessions, input.now, input.describe, { schedule: input.schedule });

  const cells = new Map<string, CalendarDay>();
  for (const [date, day] of days) {
    cells.set(date, {
      totalLabel: formatHoursShort(day.totalMs),
      dots: day.items.map((item) => ({ key: item.itemId, color: item.color })),
    });
  }

  const inMonth = [...days.values()].filter((day) => isSameMonth(parseISO(day.date), input.month));
  return {
    days,
    cells,
    groups: groupTotals(inMonth),
    totalMs: inMonth.reduce((sum, day) => sum + day.totalMs, 0),
    activeDays: inMonth.length,
  };
}

export const monthLabel = (month: Date) => format(month, "MMMM");
