"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ISSUE_STATUS_LABEL, type IssueStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

import type { Issue } from "../types";
import { useBoard } from "./board-context";
import { IssueCard } from "./issue-card";
import { StatusIcon } from "./issue-meta";

type KanbanColumnProps = {
  status: IssueStatus;
  issues: Issue[];
};

export function KanbanColumn({ status, issues }: KanbanColumnProps) {
  const { onAddIssue } = useBoard();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      aria-label={ISSUE_STATUS_LABEL[status]}
      className="flex w-[82vw] max-w-80 shrink-0 snap-start flex-col rounded-[calc(var(--radius)+0.25rem)] bg-muted/50 sm:w-72 lg:w-auto lg:max-w-none lg:min-w-0 lg:flex-1"
    >
      <header className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <StatusIcon status={status} />
        <h2 className="text-xs font-semibold tracking-wide uppercase">{ISSUE_STATUS_LABEL[status]}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{issues.length}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto text-muted-foreground"
          aria-label={`Add issue to ${ISSUE_STATUS_LABEL[status]}`}
          onClick={() => onAddIssue(status)}
        >
          <PlusIcon />
        </Button>
      </header>

      <SortableContext id={status} items={issues.map((issue) => issue.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 rounded-b-[inherit] px-2 pb-2 transition-colors",
            isOver && "bg-primary/5",
          )}
        >
          {issues.map((issue) => (
            <SortableIssueCard key={issue.id} issue={issue} />
          ))}
          {issues.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              Drop issues here
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableIssueCard({ issue }: { issue: Issue }) {
  const { projectKey, onOpenIssue } = useBoard();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });

  return (
    <IssueCard
      ref={setNodeRef}
      issue={issue}
      projectKey={projectKey}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="cursor-grab touch-manipulation"
      {...attributes}
      {...listeners}
      aria-label={`${issue.title}. Press Enter to open, Space to move.`}
      onClick={() => onOpenIssue(issue.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpenIssue(issue.id);
          return;
        }
        listeners?.onKeyDown?.(event);
      }}
    />
  );
}
