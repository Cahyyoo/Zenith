"use client";

import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { collapseVariants } from "@/lib/motion";
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
  onStart: (task: Task) => void;
  onPause: (task: Task) => void;
};

export function TaskList({ open, completed, today, onToggle, onOpen, onDelete, onStart, onPause }: TaskListProps) {
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
      onStart={() => onStart(task)}
      onPause={() => onPause(task)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {/* The page itself fades in on navigation, so rows only animate when
            they are added, completed (moved out) or deleted afterwards. */}
        <AnimatePresence initial={false}>{open.map(renderRow)}</AnimatePresence>
      </ul>

      {completed.length > 0 ? (
        <section>
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            aria-expanded={showCompleted}
            className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDownIcon
              className={cn("size-4 transition-transform duration-200", !showCompleted && "-rotate-90")}
            />
            Completed ({completed.length})
          </button>
          <AnimatePresence initial={false}>
            {showCompleted ? (
              <motion.div
                key="completed"
                variants={collapseVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="overflow-hidden"
              >
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>{completed.map(renderRow)}</AnimatePresence>
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      ) : null}
    </div>
  );
}
