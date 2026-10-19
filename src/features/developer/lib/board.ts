import { ISSUE_STATUSES, type IssueStatus } from "@/lib/domain";

import type { Issue } from "../types";
import { needsRebalance, positionBetween } from "./position";

/** Issue ids per status column, in display order. */
export type Columns = Record<IssueStatus, string[]>;

export function isStatus(id: string): id is IssueStatus {
  return (ISSUE_STATUSES as readonly string[]).includes(id);
}

export function groupIssues(issues: readonly Issue[]): Columns {
  const columns: Columns = { backlog: [], todo: [], in_progress: [], done: [] };
  const sorted = [...issues].sort((a, b) => a.position - b.position);
  for (const issue of sorted) columns[issue.status].push(issue.id);
  return columns;
}

/** The column an id belongs to: either a column id itself or a card inside one. */
export function findColumn(columns: Columns, id: string): IssueStatus | undefined {
  if (isStatus(id)) return id;
  return ISSUE_STATUSES.find((status) => columns[status].includes(id));
}

/**
 * Moves `activeId` into the column of `overId` while dragging across columns.
 * Dropping on a column (not a card) appends to its end.
 */
export function moveAcross(columns: Columns, activeId: string, overId: string): Columns {
  const from = findColumn(columns, activeId);
  const to = findColumn(columns, overId);
  if (!from || !to || from === to) return columns;

  const target = columns[to];
  const overIndex = target.indexOf(overId);
  const insertAt = overIndex === -1 ? target.length : overIndex;

  return {
    ...columns,
    [from]: columns[from].filter((id) => id !== activeId),
    [to]: [...target.slice(0, insertAt), activeId, ...target.slice(insertAt)],
  };
}

/** Reorders within a single column (the final step of a drop). */
export function reorderWithin(columns: Columns, activeId: string, overId: string): Columns {
  const column = findColumn(columns, activeId);
  if (!column || findColumn(columns, overId) !== column || activeId === overId) return columns;

  const ids = columns[column];
  const from = ids.indexOf(activeId);
  const to = isStatus(overId) ? ids.length - 1 : ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return columns;

  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, activeId);
  return { ...columns, [column]: next };
}

export type DropResult =
  | { kind: "none" }
  | { kind: "move"; status: IssueStatus; position: number }
  | { kind: "rebalance"; status: IssueStatus; orderedIds: string[] };

/**
 * Turns the final column layout into a single write: a midpoint position
 * between the new neighbours, or a column rebalance when floats run out.
 */
export function resolveDrop(
  before: Columns,
  after: Columns,
  activeId: string,
  issuesById: ReadonlyMap<string, Issue>,
): DropResult {
  const status = findColumn(after, activeId);
  if (!status) return { kind: "none" };

  const ids = after[status];
  const index = ids.indexOf(activeId);
  const originalStatus = findColumn(before, activeId);
  if (originalStatus === status && before[status].indexOf(activeId) === index) {
    return { kind: "none" };
  }

  const prev = index > 0 ? ids[index - 1] : undefined;
  const next = ids[index + 1];
  const prevPosition = prev ? issuesById.get(prev)?.position : undefined;
  const nextPosition = next ? issuesById.get(next)?.position : undefined;

  if (needsRebalance(prevPosition, nextPosition)) {
    return { kind: "rebalance", status, orderedIds: ids };
  }
  return { kind: "move", status, position: positionBetween(prevPosition, nextPosition) };
}
