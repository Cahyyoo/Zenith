import { describe, expect, it } from "vitest";

import { buildPayload, isGoneStatus, isStale } from "./reminders.ts";

const reminder = {
  id: "t1",
  user_id: "u1",
  title: "Pay internet bill",
  due_time: "14:00:00",
  remind_at: "2026-11-09T06:45:00.000Z",
  remind_offset_minutes: 15,
};

describe("send-reminders helpers", () => {
  it("builds the notification text", () => {
    expect(buildPayload(reminder)).toEqual({ title: "Pay internet bill", body: "In 15 minutes · 14:00", tag: "t1", url: "/p" });
    expect(buildPayload({ ...reminder, remind_offset_minutes: 0 }).body).toBe("Due now · 14:00");
    expect(buildPayload({ ...reminder, remind_offset_minutes: 60 }).body).toBe("In 1 hour · 14:00");
  });

  it("skips reminders that are many hours late", () => {
    expect(isStale(reminder, new Date("2026-11-09T07:00:00.000Z"))).toBe(false);
    expect(isStale(reminder, new Date("2026-11-09T20:00:00.000Z"))).toBe(true);
  });

  it("recognises expired subscriptions", () => {
    expect(isGoneStatus(410)).toBe(true);
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(500)).toBe(false);
  });
});
