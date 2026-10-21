import { differenceInCalendarDays, parseISO } from "date-fns";

import { ISSUE_PRIORITY_LABEL, type IssuePriority } from "@/lib/domain";

import type { Issue, Project } from "../types";

/**
 * Cross-project "what should I work on next?" ranking.
 *
 * Issue priority dominates (steps of 10). Everything else — project priority,
 * project deadline and the bug tie-breaker — adds at most 17, so context can
 * lift an issue by one priority level but never by two.
 */
const ISSUE_PRIORITY_SCORE: Record<IssuePriority, number> = { critical: 30, high: 20, medium: 10, low: 0 };
const PROJECT_PRIORITY_SCORE: Record<IssuePriority, number> = { critical: 9, high: 6, medium: 3, low: 0 };
const BUG_SCORE = 2;

export type FocusItem = {
  issue: Issue;
  project: Project;
  score: number;
  /** Human-readable reasons for the rank, most important first. */
  reasons: string[];
};

export type FocusGroups = {
  inProgress: FocusItem[];
  upNext: FocusItem[];
  backlog: FocusItem[];
};

export type Deadline = { days: number; label: string; tone: "overdue" | "soon" | "upcoming" | "later" };

/** Days until a project's target date, with a short label. `null` without a date. */
export function projectDeadline(project: Project, today: string): Deadline | null {
  if (!project.target_date) return null;
  const days = differenceInCalendarDays(parseISO(project.target_date), parseISO(today));
  if (days < 0) return { days, label: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, tone: "overdue" };
  if (days === 0) return { days, label: "Due today", tone: "soon" };
  if (days <= 7) return { days, label: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "soon" };
  if (days <= 14) return { days, label: `Due in ${days} days`, tone: "upcoming" };
  return { days, label: `Due in ${days} days`, tone: "later" };
}

function deadlineScore(deadline: Deadline | null): number {
  if (!deadline) return 0;
  if (deadline.days < 0) return 6;
  if (deadline.days <= 3) return 5;
  if (deadline.days <= 7) return 3;
  if (deadline.days <= 14) return 1;
  return 0;
}

/** How pressing a project is overall (priority + deadline); used to sort projects. */
export function projectUrgency(project: Project, today: string): number {
  return PROJECT_PRIORITY_SCORE[project.priority] + deadlineScore(projectDeadline(project, today));
}

function scoreIssue(issue: Issue, project: Project, today: string): FocusItem {
  const deadline = projectDeadline(project, today);
  const reasons: string[] = [];

  if (issue.priority === "critical" || issue.priority === "high") reasons.push(ISSUE_PRIORITY_LABEL[issue.priority]);
  if (deadline && deadline.tone !== "later") reasons.push(deadline.tone === "overdue" ? "Project overdue" : `Project ${deadline.label.toLowerCase()}`);
  if (project.priority === "critical" || project.priority === "high") {
    reasons.push(`${ISSUE_PRIORITY_LABEL[project.priority]}-priority project`);
  }
  if (issue.type === "bug") reasons.push("Bug");

  const score =
    ISSUE_PRIORITY_SCORE[issue.priority] +
    PROJECT_PRIORITY_SCORE[project.priority] +
    deadlineScore(deadline) +
    (issue.type === "bug" ? BUG_SCORE : 0);

  return { issue, project, score, reasons };
}

function compareItems(a: FocusItem, b: FocusItem): number {
  if (a.score !== b.score) return b.score - a.score;
  // Nearest project deadline first; projects without one go last.
  const aDate = a.project.target_date ?? "9999-12-31";
  const bDate = b.project.target_date ?? "9999-12-31";
  if (aDate !== bDate) return aDate.localeCompare(bDate);
  if (a.issue.project_id === b.issue.project_id && a.issue.position !== b.issue.position) {
    return a.issue.position - b.issue.position;
  }
  return a.issue.created_at.localeCompare(b.issue.created_at);
}

/** Ranks every open issue in active projects into In progress / Up next / Backlog. */
export function rankFocus(issues: readonly Issue[], projects: readonly Project[], today: string): FocusGroups {
  const active = new Map(projects.filter((p) => !p.archived).map((p) => [p.id, p]));
  const groups: FocusGroups = { inProgress: [], upNext: [], backlog: [] };

  for (const issue of issues) {
    const project = active.get(issue.project_id);
    if (!project || issue.status === "done") continue;
    const item = scoreIssue(issue, project, today);
    if (issue.status === "in_progress") groups.inProgress.push(item);
    else if (issue.status === "todo") groups.upNext.push(item);
    else groups.backlog.push(item);
  }

  groups.inProgress.sort(compareItems);
  groups.upNext.sort(compareItems);
  groups.backlog.sort(compareItems);
  return groups;
}

/** The single most important thing to do now: finish started work first. */
export function nextUp(groups: FocusGroups): FocusItem | undefined {
  return groups.inProgress[0] ?? groups.upNext[0] ?? groups.backlog[0];
}
