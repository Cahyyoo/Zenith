import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCHEDULE,
  describeSchedule,
  hoursPerWeek,
  parseSchedule,
  SCHEDULE_PRESETS,
  workScheduleSchema,
} from "./work-schedule";

describe("work schedule", () => {
  it("defaults to Monday–Friday 09:00–17:00", () => {
    expect(describeSchedule(DEFAULT_SCHEDULE)).toBe("Mon–Fri 09:00–17:00");
    expect(hoursPerWeek(DEFAULT_SCHEDULE)).toBe(40);
  });

  it("rejects an end time before the start time on a working day", () => {
    const broken = DEFAULT_SCHEDULE.map((day, i) => (i === 0 ? { ...day, start: "17:00", end: "09:00" } : day));
    expect(workScheduleSchema.safeParse(broken).success).toBe(false);
    // A day off may keep any times.
    const off = DEFAULT_SCHEDULE.map((day, i) => (i === 6 ? { enabled: false, start: "17:00", end: "09:00" } : day));
    expect(workScheduleSchema.safeParse(off).success).toBe(true);
  });

  it("falls back to the default for missing or invalid stored data", () => {
    expect(parseSchedule(null)).toEqual(DEFAULT_SCHEDULE);
    expect(parseSchedule([{ enabled: true }])).toEqual(DEFAULT_SCHEDULE);
    expect(parseSchedule(SCHEDULE_PRESETS[2]?.schedule)).toEqual(SCHEDULE_PRESETS[2]?.schedule);
  });

  it("allows a working day to end at midnight", () => {
    const allDay = DEFAULT_SCHEDULE.map(() => ({ enabled: true, start: "00:00", end: "24:00" }));
    expect(workScheduleSchema.safeParse(allDay).success).toBe(true);
    expect(hoursPerWeek(allDay)).toBe(168);
  });

  it("describes custom schedules", () => {
    const custom = DEFAULT_SCHEDULE.map((day, i) => (i === 4 ? { ...day, end: "15:00" } : day));
    expect(describeSchedule(custom)).toBe("Custom (38h/week)");
    expect(describeSchedule(SCHEDULE_PRESETS[2]?.schedule ?? [])).toBe("Mon–Sun 09:00–17:00");
  });
});
