import { describe, expect, it } from "vitest";

import type { Task } from "../types";
import { dueState, sortTasks } from "./sort";

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    user_id: "u",
    title: overrides.id,
    notes: "",
    due_date: null,
    completed: false,
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    tag_ids: [],
    ...overrides,
  };
}

describe("sortTasks", () => {
  it("puts open tasks first, nearest due date first, undated last", () => {
    const sorted = sortTasks([
      task({ id: "undated" }),
      task({ id: "done", completed: true, completed_at: "2026-01-02T00:00:00.000Z" }),
      task({ id: "later", due_date: "2026-03-01" }),
      task({ id: "soon", due_date: "2026-02-01" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["soon", "later", "undated", "done"]);
  });

  it("breaks ties by creation time and orders completed tasks newest first", () => {
    const sorted = sortTasks([
      task({ id: "b", created_at: "2026-01-02T00:00:00.000Z" }),
      task({ id: "a", created_at: "2026-01-01T00:00:00.000Z" }),
      task({ id: "old-done", completed: true, completed_at: "2026-01-01T00:00:00.000Z" }),
      task({ id: "new-done", completed: true, completed_at: "2026-01-05T00:00:00.000Z" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["a", "b", "new-done", "old-done"]);
  });

  it("does not mutate its input", () => {
    const input = [task({ id: "b", due_date: "2026-02-02" }), task({ id: "a", due_date: "2026-02-01" })];
    sortTasks(input);
    expect(input.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("dueState", () => {
  it("classifies due dates relative to today", () => {
    expect(dueState("2026-01-09", "2026-01-10")).toBe("overdue");
    expect(dueState("2026-01-10", "2026-01-10")).toBe("today");
    expect(dueState("2026-01-12", "2026-01-10")).toBe("soon");
    expect(dueState("2026-01-20", "2026-01-10")).toBe("later");
  });
});
