"use client";

import { CheckIcon, PlayIcon } from "lucide-react";
import { motion } from "motion/react";

import { ColorDot } from "@/components/common/color-picker";
import { Button } from "@/components/ui/button";
import { listItemVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { FocusItem } from "../lib/focus";
import { issueDisplayId, PriorityIcon, StatusIcon, TypeIcon } from "./issue-meta";

/** Small explanation of why an issue ranks where it does. */
export function ReasonChips({ reasons, className }: { reasons: string[]; className?: string }) {
  if (reasons.length === 0) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {reasons.map((reason) => (
        <span
          key={reason}
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium",
            reason === "Critical" || reason === "Project overdue"
              ? "bg-destructive/12 text-destructive"
              : reason.startsWith("Project due") || reason === "High"
                ? "bg-highlight/15 text-highlight"
                : "bg-muted text-muted-foreground",
          )}
        >
          {reason}
        </span>
      ))}
    </span>
  );
}

type FocusRowProps = {
  item: FocusItem;
  rank: number;
  onOpen: () => void;
  onStart: () => void;
  onDone: () => void;
};

export function FocusRow({ item, rank, onOpen, onStart, onDone }: FocusRowProps) {
  const { issue, project, reasons } = item;
  const started = issue.status === "in_progress";

  return (
    <motion.li
      layout="position"
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="overflow-hidden"
    >
      <div className="group flex items-center gap-3 rounded-[var(--radius)] border bg-card px-3 py-2.5 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm">
        <span className="w-5 shrink-0 text-center font-mono text-[11px] text-muted-foreground tabular-nums">{rank}</span>
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col gap-1 text-left outline-none focus-visible:underline">
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <ColorDot color={project.color} className="size-2" />
            <span className="font-mono">{issueDisplayId(project.key, issue.number)}</span>
            <span className="truncate">· {project.name}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <StatusIcon status={issue.status} />
            <PriorityIcon priority={issue.priority} />
            <TypeIcon type={issue.type} />
            <span className="truncate text-[13px] font-medium">{issue.title}</span>
          </span>
          <ReasonChips reasons={reasons} />
        </button>
        {started ? (
          <Button size="sm" variant="outline" onClick={onDone} aria-label={`Mark ${issue.title} done`}>
            <CheckIcon />
            <span className="hidden sm:inline">Done</span>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onStart} aria-label={`Start ${issue.title}`}>
            <PlayIcon />
            <span className="hidden sm:inline">Start</span>
          </Button>
        )}
      </div>
    </motion.li>
  );
}
