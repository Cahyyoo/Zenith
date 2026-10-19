"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { Tag, Task } from "../types";
import { TaskItem } from "./task-item";

export type TaskRow = { task: Task; tags: Tag[] };

type TaskListProps = {
  open: TaskRow[];
  completed: TaskRow[];
  today: string;
  onToggle: (task: Task, completed: boolean) => void;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskList({ open, completed, today, onToggle, onOpen, onDelete }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const renderRow = ({ task, tags }: TaskRow) => (
    <TaskItem
      key={task.id}
      task={task}
      tags={tags}
      today={today}
      onToggle={(value) => onToggle(task, value)}
      onOpen={() => onOpen(task)}
      onDelete={() => onDelete(task)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {open.length > 0 ? <ul className="flex flex-col gap-2">{open.map(renderRow)}</ul> : null}

      {completed.length > 0 ? (
        <section>
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            aria-expanded={showCompleted}
            className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDownIcon className={cn("size-4 transition-transform", !showCompleted && "-rotate-90")} />
            Completed ({completed.length})
          </button>
          {showCompleted ? <ul className="flex flex-col gap-2">{completed.map(renderRow)}</ul> : null}
        </section>
      ) : null}
    </div>
  );
}
