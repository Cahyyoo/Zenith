import { describe, expect, it } from "vitest";

import type { Issue } from "../types";
import { groupIssues, moveAcross, reorderWithin, resolveDrop } from "./board";

function issue(id: string, status: Issue["status"], position: number): Issue {
  return {
    id,
    status,
    position,
    user_id: "u",
    project_id: "p",
    number: 1,
    title: id,
    description_md: "",
    type: "feature",
    priority: "medium",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

const issues = [issue("a", "todo", 1024), issue("b", "todo", 2048), issue("c", "done", 1024)];
const byId = new Map(issues.map((i) => [i.id, i]));

describe("groupIssues", () => {
  it("buckets issues by status in position order", () => {
    const columns = groupIssues([issue("y", "todo", 5), issue("x", "todo", 1)]);
    expect(columns.todo).toEqual(["x", "y"]);
    expect(columns.backlog).toEqual([]);
  });
});

describe("drag and drop", () => {
  it("moves a card into another column above the hovered card", () => {
    const start = groupIssues(issues);
    const moved = moveAcross(start, "a", "c");
    expect(moved.todo).toEqual(["b"]);
    expect(moved.done).toEqual(["a", "c"]);
    expect(resolveDrop(start, moved, "a", byId)).toEqual({ kind: "move", status: "done", position: 0 });
  });

  it("appends when dropped on an empty column", () => {
    const start = groupIssues(issues);
    const moved = moveAcross(start, "a", "backlog");
    expect(moved.backlog).toEqual(["a"]);
    expect(resolveDrop(start, moved, "a", byId)).toEqual({ kind: "move", status: "backlog", position: 1024 });
  });

  it("reorders within a column using the midpoint of the new neighbours", () => {
    const withThird = [...issues, issue("d", "todo", 3072)];
    const map = new Map(withThird.map((i) => [i.id, i]));
    const start = groupIssues(withThird);
    const reordered = reorderWithin(start, "a", "b");
    expect(reordered.todo).toEqual(["b", "a", "d"]);
    expect(resolveDrop(start, reordered, "a", map)).toEqual({ kind: "move", status: "todo", position: 2560 });
  });

  it("reports a no-op when a card is dropped where it started", () => {
    const start = groupIssues(issues);
    expect(resolveDrop(start, start, "a", byId)).toEqual({ kind: "none" });
  });

  it("asks for a rebalance when neighbours are too close", () => {
    const tight = [issue("a", "todo", 1), issue("b", "todo", 1 + 1e-9), issue("c", "done", 5)];
    const map = new Map(tight.map((i) => [i.id, i]));
    const start = groupIssues(tight);
    const moved = moveAcross(start, "c", "b");
    expect(resolveDrop(start, moved, "c", map)).toEqual({
      kind: "rebalance",
      status: "todo",
      orderedIds: ["a", "c", "b"],
    });
  });
});
