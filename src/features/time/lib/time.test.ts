import { describe, expect, it } from "vitest";

import {
  buildCalendar,
  closeLocallyStopped,
  formatDuration,
  formatHoursShort,
  groupTotals,
  mergeLocalRunning,
  monthGrid,
  splitByDay,
  type ItemInfo,
  type Session,
} from "./time";

// Local-time constructors keep these tests independent of the machine's timezone.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();
const HOUR = 3_600_000;

const info = (label: string, groupKey = "g1"): ItemInfo => ({ label, color: "blue", groupKey, groupLabel: groupKey });

describe("splitByDay", () => {
  it("keeps a same-day session whole", () => {
    const parts = splitByDay({ id: "s", itemId: "a", start: at(20, 9), end: at(20, 11) }, at(24, 0));
    expect(parts).toEqual([{ date: "2026-10-20", segment: { start: at(20, 9), end: at(20, 11), running: false } }]);
  });

  it("splits a session at local midnight", () => {
    const parts = splitByDay({ id: "s", itemId: "a", start: at(20, 22), end: at(21, 2) }, at(24, 0));
    expect(parts.map((p) => [p.date, (p.segment.end - p.segment.start) / HOUR])).toEqual([
      ["2026-10-20", 2],
      ["2026-10-21", 2],
    ]);
  });

  it("counts a running session up to now and marks only the last part running", () => {
    const parts = splitByDay({ id: "s", itemId: "a", start: at(22, 23), end: null }, at(23, 1, 30));
    expect(parts.map((p) => [p.date, p.segment.running])).toEqual([
      ["2026-10-22", false],
      ["2026-10-23", true],
    ]);
    expect(parts[1]?.segment.end).toBe(at(23, 1, 30));
  });

  it("shows a session that started after `now` (just started) right away", () => {
    const parts = splitByDay({ id: "s", itemId: "a", start: at(23, 10, 0), end: null }, at(23, 9, 59));
    expect(parts).toHaveLength(1);
    expect(parts[0]?.segment.running).toBe(true);
  });
});

describe("buildCalendar", () => {
  const sessions: Session[] = [
    { id: "1", itemId: "a", start: at(20, 9), end: at(20, 10) },
    { id: "2", itemId: "b", start: at(20, 13), end: at(20, 16) },
    { id: "3", itemId: "a", start: at(20, 17), end: at(20, 17, 30) },
    { id: "4", itemId: "hidden", start: at(20, 8), end: at(20, 9) },
  ];
  const describeItem = (id: string) => (id === "hidden" ? undefined : info(id.toUpperCase(), id === "a" ? "g1" : "g2"));

  it("sums time per item and per day, largest first, skipping unknown items", () => {
    const day = buildCalendar(sessions, at(24, 0), describeItem).get("2026-10-20");
    expect(day?.totalMs).toBe(4.5 * HOUR);
    expect(day?.items.map((item) => [item.label, item.ms / HOUR, item.segments.length])).toEqual([
      ["B", 3, 1],
      ["A", 1.5, 2],
    ]);
  });

  it("totals per group across days", () => {
    const days = buildCalendar(sessions, at(24, 0), describeItem);
    expect(groupTotals(days.values()).map((g) => [g.key, g.ms / HOUR])).toEqual([
      ["g2", 3],
      ["g1", 1.5],
    ]);
  });
});

describe("monthGrid", () => {
  it("covers whole Monday-first weeks around October 2026", () => {
    const weeks = monthGrid(new Date(2026, 9, 15));
    expect(weeks[0]?.[0]).toBe("2026-09-28"); // Oct 1 2026 is a Thursday
    expect(weeks.at(-1)?.at(-1)).toBe("2026-11-01");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(20_000)).toBe("<1m");
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(2 * HOUR + 5 * 60_000)).toBe("2h 05m");
    expect(formatHoursShort(2.5 * HOUR)).toBe("2.5h");
    expect(formatHoursShort(12.4 * HOUR)).toBe("12h");
    expect(formatHoursShort(10_000)).toBe("1m");
  });
});

describe("local state before sync", () => {
  it("adds a running session for items started locally", () => {
    const merged = mergeLocalRunning(
      [{ id: "1", itemId: "a", start: at(20, 9), end: null }],
      [
        { itemId: "a", since: "2026-10-20T00:00:00.000Z" },
        { itemId: "b", since: new Date(at(21, 10)).toISOString() },
        { itemId: "c", since: null },
      ],
    );
    expect(merged.map((s) => [s.itemId, s.end])).toEqual([
      ["a", null],
      ["b", null],
    ]);
    expect(merged[1]?.start).toBe(at(21, 10));
  });

  it("ends server sessions for items stopped locally", () => {
    const closed = closeLocallyStopped(
      [
        { id: "1", itemId: "a", start: at(20, 9), end: null },
        { id: "2", itemId: "b", start: at(20, 9), end: null },
      ],
      new Map([["a", new Date(at(20, 12)).toISOString()]]),
    );
    expect(closed.map((s) => s.end)).toEqual([at(20, 12), null]);
  });
});
