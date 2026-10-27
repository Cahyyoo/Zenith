"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

import { ISSUE_STATUSES, type IssueStatus } from "@/lib/domain";

import { groupIssues, moveAcross, reorderWithin, resolveDrop, type Columns, type DropResult } from "../lib/board";
import type { Issue } from "../types";
import { useBoard } from "./board-context";
import { IssueCard } from "./issue-card";
import { KanbanColumn } from "./kanban-column";

type KanbanBoardProps = {
  issues: Issue[];
  projectKey: string;
  onDrop: (issueId: string, result: Exclude<DropResult, { kind: "none" }>) => void;
};

/**
 * Local drag layout. It is kept after a drop until the `issues` prop changes
 * (the optimistic cache update lands), so cards never flash back to their
 * old column for a frame.
 */
type DragState = { activeId: string | null; base: Issue[]; start: Columns; columns: Columns };

export function KanbanBoard({ issues, projectKey, onDrop }: KanbanBoardProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const { schedule } = useBoard();

  const issuesById = useMemo(() => new Map(issues.map((issue) => [issue.id, issue])), [issues]);
  const grouped = useMemo(() => groupIssues(issues), [issues]);
  const live = drag && (drag.activeId !== null || drag.base === issues) ? drag : null;
  const columns = live?.columns ?? grouped;
  const activeIssue = live?.activeId ? issuesById.get(live.activeId) : undefined;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter opens a card; Space picks it up.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDrag({ activeId: String(active.id), base: issues, start: grouped, columns: grouped });
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDrag((current) =>
      current ? { ...current, columns: moveAcross(current.columns, String(active.id), String(over.id)) } : current,
    );
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!drag) return;
    const activeId = String(active.id);
    const finalColumns = over ? reorderWithin(drag.columns, activeId, String(over.id)) : drag.start;
    setDrag({ ...drag, activeId: null, columns: finalColumns });

    const result = resolveDrop(drag.start, finalColumns, activeId, issuesById);
    if (result.kind === "none") {
      setDrag(null);
      return;
    }
    onDrop(activeId, result);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDrag(null)}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0 lg:snap-none">
        {ISSUE_STATUSES.map((status: IssueStatus) => (
          <KanbanColumn
            key={status}
            status={status}
            issues={columns[status].flatMap((id) => {
              const issue = issuesById.get(id);
              return issue ? [issue] : [];
            })}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeIssue ? <IssueCard issue={activeIssue} projectKey={projectKey} schedule={schedule} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
