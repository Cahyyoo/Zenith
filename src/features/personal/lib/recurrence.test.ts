import { describe, expect, it } from "vitest";

import {
  computeRemindAt,
  describeRecurrence,
  nextDueDate,
  occurrencesBetween,
  parseRecurrence,
  shortRecurrence,
  type Recurrence,
} from "./recurrence";

// November 2026: the 2nd is a Monday.
const daily = (interval: number): Recurrence => ({ freq: "day", interval });

describe("nextDueDate", () => {
  it("steps every N days from the due date", () => {
    expect(nextDueDate(daily(1), "2026-11-09", "2026-11-09")).toBe("2026-11-10");
    expect(nextDueDate(daily(2), "2026-11-09", "2026-11-09")).toBe("2026-11-11");
  });

  it("keeps the fixed schedule when completed early", () => {
    // Due Friday, ticked on Wednesday → next is Friday + 2, not Wednesday + 2.
    expect(nextDueDate(daily(2), "2026-11-13", "2026-11-11")).toBe("2026-11-15");
  });

  it("jumps over occurrences already in the past", () => {
    // Due Mon 2nd every 2 days, completed on Sat 7th → 4th, 6th passed → 8th.
    expect(nextDueDate(daily(2), "2026-11-02", "2026-11-07")).toBe("2026-11-08");
    // Landing exactly on today is fine.
    expect(nextDueDate(daily(2), "2026-11-02", "2026-11-06")).toBe("2026-11-06");
  });

  it("repeats weekly on chosen weekdays", () => {
    const monThu: Recurrence = { freq: "week", interval: 1, weekdays: [0, 3] };
    expect(nextDueDate(monThu, "2026-11-02", "2026-11-02")).toBe("2026-11-05");
    expect(nextDueDate(monThu, "2026-11-05", "2026-11-05")).toBe("2026-11-09");
  });

  it("repeats every 2 weeks, skipping the off week", () => {
    const biweeklyFri: Recurrence = { freq: "week", interval: 2, weekdays: [4] };
    expect(nextDueDate(biweeklyFri, "2026-11-06", "2026-11-06")).toBe("2026-11-20");
    // Without weekdays it keeps the due date's weekday.
    expect(nextDueDate({ freq: "week", interval: 2 }, "2026-11-04", "2026-11-04")).toBe("2026-11-18");
  });

  it("keeps the day of month through short months", () => {
    const monthly31: Recurrence = { freq: "month", interval: 1, anchorDay: 31 };
    expect(nextDueDate(monthly31, "2027-01-31", "2027-01-31")).toBe("2027-02-28");
    expect(nextDueDate(monthly31, "2027-02-28", "2027-02-28")).toBe("2027-03-31");
    expect(nextDueDate({ freq: "month", interval: 3 }, "2026-11-25", "2026-11-25")).toBe("2027-02-25");
  });

  it("repeats yearly, falling back to Feb 28 outside leap years", () => {
    expect(nextDueDate({ freq: "year", interval: 1 }, "2028-02-29", "2028-02-29")).toBe("2029-02-28");
    expect(nextDueDate({ freq: "year", interval: 1 }, "2026-12-01", "2026-12-01")).toBe("2027-12-01");
  });
});

describe("occurrencesBetween", () => {
  it("lists upcoming occurrences inside a range", () => {
    expect(occurrencesBetween(daily(3), "2026-11-02", "2026-11-04", "2026-11-14")).toEqual([
      "2026-11-05",
      "2026-11-08",
      "2026-11-11",
      "2026-11-14",
    ]);
  });
});

describe("labels and parsing", () => {
  it("describes rules", () => {
    expect(describeRecurrence(daily(1))).toBe("Every day");
    expect(describeRecurrence(daily(2))).toBe("Every 2 days");
    expect(describeRecurrence({ freq: "week", interval: 1, weekdays: [3, 0] })).toBe("Every week on Mon, Thu");
    expect(describeRecurrence({ freq: "month", interval: 2 })).toBe("Every 2 months");
    expect(shortRecurrence({ freq: "year", interval: 1 })).toBe("Yearly");
    expect(shortRecurrence(daily(2))).toBe("2 days");
  });

  it("treats invalid stored rules as not repeating", () => {
    expect(parseRecurrence(null)).toBeNull();
    expect(parseRecurrence({ freq: "hour", interval: 1 })).toBeNull();
    expect(parseRecurrence({ freq: "day", interval: 2 })).toEqual(daily(2));
  });
});

describe("computeRemindAt", () => {
  it("subtracts the offset from the local due time", () => {
    const at = computeRemindAt("2026-11-09", "14:00", 15);
    expect(at).toBe(new Date(2026, 10, 9, 13, 45).toISOString());
    expect(computeRemindAt("2026-11-09", "14:00", 0)).toBe(new Date(2026, 10, 9, 14, 0).toISOString());
  });

  it("needs a date, a time and a reminder", () => {
    expect(computeRemindAt("2026-11-09", null, 0)).toBeNull();
    expect(computeRemindAt(null, "09:00", 0)).toBeNull();
    expect(computeRemindAt("2026-11-09", "09:00", null)).toBeNull();
  });
});
