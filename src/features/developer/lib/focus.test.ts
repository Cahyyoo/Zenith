import { describe, expect, it } from "vitest";

import type { Issue, Project } from "../types";
import { nextUp, projectDeadline, projectUrgency, rankFocus } from "./focus";

const TODAY = "2026-10-21";
let seq = 0;

function project(overrides: Partial<Project> & { id: string }): Project {
  return {
    user_id: "u",
    name: overrides.id,
    key: overrides.id.toUpperCase(),
    description: "",
    color: "blue",
    archived: false,
    priority: "medium",
    target_date: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function issue(overrides: Partial<Issue> & { project_id: string }): Issue {
  seq += 1;
  return {
    id: `i${seq}`,
    user_id: "u",
    number: seq,
    title: `Issue ${seq}`,
    description_md: "",
    type: "feature",
    priority: "medium",
    status: "todo",
    position: seq * 1024,
    status_changed_at: null,
    created_at: `2026-01-01T00:00:${String(seq).padStart(2, "0")}.000Z`,
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const ids = (items: { issue: Issue }[]) => items.map((item) => item.issue.title);

describe("rankFocus", () => {
  it("groups by status and always puts started work first", () => {
    const p = project({ id: "a" });
    const started = issue({ project_id: "a", status: "in_progress", priority: "low", title: "started" });
    const critical = issue({ project_id: "a", priority: "critical", title: "critical todo" });
    const later = issue({ project_id: "a", status: "backlog", title: "someday" });
    const groups = rankFocus([critical, later, started], [p], TODAY);

    expect(ids(groups.inProgress)).toEqual(["started"]);
    expect(ids(groups.upNext)).toEqual(["critical todo"]);
    expect(ids(groups.backlog)).toEqual(["someday"]);
    expect(nextUp(groups)?.issue.title).toBe("started");
  });

  it("orders by issue priority first", () => {
    const p = project({ id: "a" });
    const groups = rankFocus(
      [
        issue({ project_id: "a", priority: "low", title: "low" }),
        issue({ project_id: "a", priority: "critical", title: "critical" }),
        issue({ project_id: "a", priority: "medium", title: "medium" }),
        issue({ project_id: "a", priority: "high", title: "high" }),
      ],
      [p],
      TODAY,
    );
    expect(ids(groups.upNext)).toEqual(["critical", "high", "medium", "low"]);
  });

  it("lets an urgent project lift an issue by one priority level, never two", () => {
    const urgent = project({ id: "urgent", priority: "critical", target_date: "2026-10-20" });
    const relaxed = project({ id: "relaxed", priority: "low" });
    const groups = rankFocus(
      [
        issue({ project_id: "relaxed", priority: "critical", title: "relaxed critical" }),
        issue({ project_id: "urgent", priority: "high", type: "bug", title: "urgent high bug" }),
        issue({ project_id: "relaxed", priority: "high", title: "relaxed high" }),
        issue({ project_id: "urgent", priority: "medium", type: "bug", title: "urgent medium bug" }),
      ],
      [urgent, relaxed],
      TODAY,
    );
    // High (20) + critical project (9) + overdue (6) + bug (2) = 37 beats Critical (30) in a low project.
    // Medium (10) + 17 = 27 still loses to Critical (30): at most one level.
    expect(ids(groups.upNext)).toEqual(["urgent high bug", "relaxed critical", "urgent medium bug", "relaxed high"]);
  });

  it("boosts issues from projects close to their deadline", () => {
    const soon = project({ id: "soon", target_date: "2026-10-23" });
    const far = project({ id: "far", target_date: "2027-03-01" });
    const groups = rankFocus(
      [issue({ project_id: "far", title: "far" }), issue({ project_id: "soon", title: "soon" })],
      [soon, far],
      TODAY,
    );
    expect(ids(groups.upNext)).toEqual(["soon", "far"]);
    expect(groups.upNext[0]?.reasons).toContain("Project due in 2 days");
  });

  it("puts bugs first when everything else is equal, then the nearest deadline", () => {
    const a = project({ id: "a", target_date: "2026-12-31" });
    const b = project({ id: "b", target_date: "2026-12-01" });
    const groups = rankFocus(
      [
        issue({ project_id: "a", title: "feature a" }),
        issue({ project_id: "a", type: "bug", title: "bug a" }),
        issue({ project_id: "b", title: "feature b" }),
      ],
      [a, b],
      TODAY,
    );
    expect(ids(groups.upNext)).toEqual(["bug a", "feature b", "feature a"]);
  });

  it("keeps board order for equal issues in the same project", () => {
    const p = project({ id: "a" });
    const first = issue({ project_id: "a", position: 100, title: "first" });
    const second = issue({ project_id: "a", position: 200, title: "second" });
    expect(ids(rankFocus([second, first], [p], TODAY).upNext)).toEqual(["first", "second"]);
  });

  it("ignores done issues and archived projects", () => {
    const live = project({ id: "live" });
    const old = project({ id: "old", archived: true });
    const groups = rankFocus(
      [
        issue({ project_id: "live", status: "done", title: "done" }),
        issue({ project_id: "old", priority: "critical", title: "archived" }),
        issue({ project_id: "live", title: "open" }),
        issue({ project_id: "missing", title: "orphan" }),
      ],
      [live, old],
      TODAY,
    );
    expect(ids([...groups.inProgress, ...groups.upNext, ...groups.backlog])).toEqual(["open"]);
  });
});

describe("project helpers", () => {
  it("describes deadlines", () => {
    expect(projectDeadline(project({ id: "a" }), TODAY)).toBeNull();
    expect(projectDeadline(project({ id: "a", target_date: "2026-10-19" }), TODAY)).toMatchObject({ tone: "overdue", label: "Overdue by 2 days" });
    expect(projectDeadline(project({ id: "a", target_date: "2026-10-21" }), TODAY)).toMatchObject({ tone: "soon", label: "Due today" });
    expect(projectDeadline(project({ id: "a", target_date: "2026-10-31" }), TODAY)).toMatchObject({ tone: "upcoming" });
  });

  it("ranks project urgency by priority plus deadline", () => {
    const critical = project({ id: "c", priority: "critical" });
    const overdueMedium = project({ id: "m", priority: "medium", target_date: "2026-10-01" });
    const low = project({ id: "l", priority: "low" });
    expect(projectUrgency(critical, TODAY)).toBe(9);
    expect(projectUrgency(overdueMedium, TODAY)).toBe(9);
    expect(projectUrgency(low, TODAY)).toBe(0);
  });
});
