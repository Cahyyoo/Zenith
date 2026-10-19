import { z } from "zod";

import type { Enums } from "@/types/database";

// Zod mirrors of the Postgres enums. `satisfies` keeps them in lockstep with
// the generated database types.

export const TAG_COLORS = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
] as const satisfies readonly Enums<"tag_color">[];
export const tagColorSchema = z.enum(TAG_COLORS);
export type TagColor = z.infer<typeof tagColorSchema>;

export const ISSUE_TYPES = ["feature", "bug", "chore", "refactor"] as const satisfies readonly Enums<"issue_type">[];
export const issueTypeSchema = z.enum(ISSUE_TYPES);
export type IssueType = z.infer<typeof issueTypeSchema>;

export const ISSUE_PRIORITIES = ["low", "medium", "high", "critical"] as const satisfies readonly Enums<"issue_priority">[];
export const issuePrioritySchema = z.enum(ISSUE_PRIORITIES);
export type IssuePriority = z.infer<typeof issuePrioritySchema>;

export const ISSUE_STATUSES = ["backlog", "todo", "in_progress", "done"] as const satisfies readonly Enums<"issue_status">[];
export const issueStatusSchema = z.enum(ISSUE_STATUSES);
export type IssueStatus = z.infer<typeof issueStatusSchema>;

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  feature: "Feature",
  bug: "Bug",
  chore: "Chore",
  refactor: "Refactor",
};

export const ISSUE_PRIORITY_LABEL: Record<IssuePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/** Static class names per palette entry (kept literal so Tailwind can see them). */
export const COLOR_CLASSES: Record<TagColor, { dot: string; soft: string }> = {
  slate: { dot: "bg-slate-500", soft: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  red: { dot: "bg-red-500", soft: "bg-red-500/15 text-red-700 dark:text-red-300" },
  orange: { dot: "bg-orange-500", soft: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  amber: { dot: "bg-amber-500", soft: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  green: { dot: "bg-green-500", soft: "bg-green-500/15 text-green-700 dark:text-green-300" },
  teal: { dot: "bg-teal-500", soft: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  blue: { dot: "bg-blue-500", soft: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  violet: { dot: "bg-violet-500", soft: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  pink: { dot: "bg-pink-500", soft: "bg-pink-500/15 text-pink-700 dark:text-pink-300" },
};

export type Workspace = "personal" | "developer";
