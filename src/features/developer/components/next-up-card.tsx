"use client";

import { ArrowRightIcon, CheckIcon, PlayIcon, TargetIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ColorDot } from "@/components/common/color-picker";
import { ElapsedBadge } from "@/features/time/components/elapsed-badge";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/lib/motion";
import type { WorkSchedule } from "@/lib/work-schedule";

import type { FocusItem } from "../lib/focus";
import { ReasonChips } from "./focus-row";
import { issueDisplayId, PriorityIcon, TypeIcon } from "./issue-meta";

type NextUpCardProps = {
  item: FocusItem;
  onOpen: () => void;
  onStart: () => void;
  onDone: () => void;
  schedule?: WorkSchedule;
};

/** The single most important issue right now, given extra emphasis. */
export function NextUpCard({ item, onOpen, onStart, onDone, schedule }: NextUpCardProps) {
  const { issue, project, reasons } = item;
  const started = issue.status === "in_progress";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={issue.id}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        aria-label="Do this next"
        className="relative overflow-hidden rounded-[calc(var(--radius)+0.25rem)] border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm"
      >
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
          <TargetIcon className="size-3.5" />
          {started ? "Finish this first" : "Do this next"}
        </p>
        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ColorDot color={project.color} className="size-2" />
          <span className="font-mono">{issueDisplayId(project.key, issue.number)}</span>
          <span className="truncate">· {project.name}</span>
        </p>
        <h2 className="flex items-start gap-2 text-lg leading-snug font-semibold">
          <span className="mt-1.5 flex gap-1">
            <PriorityIcon priority={issue.priority} className="size-4" />
            <TypeIcon type={issue.type} className="size-4" />
          </span>
          {issue.title}
        </h2>
        <span className="mt-2 flex flex-wrap items-center gap-1">
          {started ? <ElapsedBadge since={issue.status_changed_at ?? null} schedule={schedule} label="In progress" /> : null}
          <ReasonChips reasons={reasons} />
        </span>
        <div className="mt-4 flex flex-wrap gap-2">
          {started ? (
            <Button onClick={onDone}>
              <CheckIcon />
              Mark done
            </Button>
          ) : (
            <Button onClick={onStart}>
              <PlayIcon />
              Start now
            </Button>
          )}
          <Button variant="ghost" onClick={onOpen}>
            Open
            <ArrowRightIcon />
          </Button>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
