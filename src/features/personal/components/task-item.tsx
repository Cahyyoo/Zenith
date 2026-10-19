"use client";

import { CalendarIcon, EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { motion, useAnimate, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDueDate } from "@/lib/dates";
import { listItemVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { dueState } from "../lib/sort";
import type { Tag, Task } from "../types";
import { TagBadge } from "./tag-badge";

const SWIPE_DISTANCE = 96;
const SWIPE_VELOCITY = 600;

type TaskItemProps = {
  task: Task;
  tags: Tag[];
  today: string;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
};

const DUE_CLASSES = {
  overdue: "text-destructive",
  today: "text-highlight font-medium",
  soon: "text-foreground",
  later: "text-muted-foreground",
} as const;

export function TaskItem({ task, tags, today, onToggle, onOpen, onDelete }: TaskItemProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const dragged = useRef(false);
  const x = useMotionValue(0);
  // The delete layer only appears while swiping, so it never bleeds through
  // the card's rounded corners at rest.
  const revealOpacity = useTransform(x, [-48, -4, 0], [1, 0, 0]);

  const handleDragEnd = async (_event: PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      await animate(scope.current, { x: "-100%", opacity: 0 }, { duration: 0.18 });
      onDelete();
    }
    // Let the click that ends a drag pass without opening the task.
    setTimeout(() => {
      dragged.current = false;
    }, 0);
  };

  const due = task.due_date && !task.completed ? dueState(task.due_date, today) : null;

  return (
    <motion.li
      // `position` animates re-sorting (e.g. a changed due date) without
      // stretching the row; enter/exit come from the shared list variants.
      layout="position"
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative overflow-hidden rounded-[var(--radius)]"
    >
      <motion.div
        aria-hidden
        style={{ opacity: revealOpacity }}
        className="absolute inset-0 flex items-center justify-end gap-2 bg-destructive px-5 text-sm font-medium text-white"
      >
        <Trash2Icon className="size-4" />
        Delete
      </motion.div>

      <motion.div
        ref={scope}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={handleDragEnd}
        className="relative flex items-start gap-3 border bg-card px-3 py-3 select-none"
        style={{ x, borderRadius: "inherit" }}
      >
        <motion.span
          className="mt-0.5 flex"
          whileTap={{ scale: 0.82 }}
          initial={false}
          animate={task.completed ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.28 }}
        >
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => onToggle(checked === true)}
            aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
            className="size-5 rounded-full transition-colors"
          />
        </motion.span>

        <button
          type="button"
          onClick={() => {
            if (!dragged.current) onOpen();
          }}
          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left outline-none focus-visible:underline"
        >
          <span
            className={cn(
              "w-full truncate text-[15px] leading-snug decoration-muted-foreground/60 transition-colors duration-200",
              task.completed && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
          {due || tags.length > 0 ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {due && task.due_date ? (
                <span className={cn("inline-flex items-center gap-1 text-xs", DUE_CLASSES[due])}>
                  <CalendarIcon className="size-3" />
                  {formatDueDate(task.due_date, today)}
                </span>
              ) : null}
              {tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </span>
          ) : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Task actions" className="-my-1 text-muted-foreground">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpen}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </motion.li>
  );
}
