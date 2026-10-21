import { ArchiveIcon, ArchiveRestoreIcon, CalendarClockIcon, EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLOR_CLASSES, ISSUE_PRIORITY_LABEL } from "@/lib/domain";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { Deadline } from "../lib/focus";
import type { Project } from "../types";
import { issueDisplayId, PriorityIcon } from "./issue-meta";

export type ProjectStats = {
  total: number;
  done: number;
  open: number;
  inProgress: number;
  critical: number;
  /** Top-ranked open issue of this project (from the Focus ranking). */
  next?: { number: number | null; title: string };
};

const DEADLINE_CLASSES: Record<Deadline["tone"], string> = {
  overdue: "bg-destructive/12 text-destructive",
  soon: "bg-highlight/15 text-highlight",
  upcoming: "bg-muted text-foreground",
  later: "bg-muted text-muted-foreground",
};

type ProjectCardProps = {
  project: Project;
  href: string;
  onEdit: () => void;
  onToggleArchived: () => void;
  onDelete: () => void;
  stats?: ProjectStats;
  deadline?: Deadline | null;
};

export function ProjectCard({ project, href, onEdit, onToggleArchived, onDelete, stats, deadline }: ProjectCardProps) {
  const progress = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-[var(--radius)] border bg-card p-4 transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
        project.archived && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", COLOR_CLASSES[project.color].dot)} aria-hidden />
        <span className="font-mono text-xs text-muted-foreground">{project.key}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="relative z-10 ml-auto" aria-label={`${project.name} actions`}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleArchived}>
              {project.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
              {project.archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Link href={href} className="font-medium leading-snug after:absolute after:inset-0">
        {project.name}
      </Link>
      {project.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
          <PriorityIcon priority={project.priority} className="size-3" />
          {ISSUE_PRIORITY_LABEL[project.priority]}
        </span>
        {deadline ? (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", DEADLINE_CLASSES[deadline.tone])}>
            <CalendarClockIcon className="size-3" />
            {deadline.label}
          </span>
        ) : null}
      </div>

      {stats ? (
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>
              {stats.open} open
              {stats.critical > 0 ? <span className="text-destructive"> · {stats.critical} critical</span> : null}
              {stats.inProgress > 0 ? ` · ${stats.inProgress} in progress` : null}
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`${project.name} progress`}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className={cn("h-full rounded-full", COLOR_CLASSES[project.color].dot)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
          </div>
          {stats.next ? (
            <p className="truncate text-xs text-muted-foreground">
              Next:{" "}
              <span className="font-mono">{issueDisplayId(project.key, stats.next.number)}</span>{" "}
              <span className="text-foreground">{stats.next.title}</span>
            </p>
          ) : stats.total > 0 ? (
            <p className="text-xs text-muted-foreground">All issues done 🎉</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
