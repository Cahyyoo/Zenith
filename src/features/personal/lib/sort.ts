import type { Task } from "../types";

/**
 * Open tasks first, ordered by the nearest due date (undated last, then by
 * creation). Completed tasks follow, most recently completed first.
 */
export function compareTasks(a: Task, b: Task): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;

  if (a.completed) {
    return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
  }

  if (a.due_date !== b.due_date) {
    if (a.due_date === null) return 1;
    if (b.due_date === null) return -1;
    return a.due_date.localeCompare(b.due_date);
  }

  return a.created_at.localeCompare(b.created_at);
}

export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}

export type DueState = "overdue" | "today" | "soon" | "later";

/** `today` is a local `yyyy-MM-dd` string so the comparison stays timezone-safe. */
export function dueState(dueDate: string, today: string, soonDays = 3): DueState {
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  const days = (Date.parse(dueDate) - Date.parse(today)) / 86_400_000;
  return days <= soonDays ? "soon" : "later";
}
