"use client";

import { TimerIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WorkSchedule } from "@/lib/work-schedule";

import { useNow } from "../hooks";
import { formatDuration, sessionDuration } from "../lib/time";

type ElapsedBadgeProps = {
  /** When the current session started (status change time). */
  since: string | null;
  label?: string;
  className?: string;
  /** Count only time inside working hours, so nights and weekends don't add up. */
  schedule?: WorkSchedule;
};

/** Live "⏱ 1h 05m" for an item whose time is currently running. */
export function ElapsedBadge({ since, label, className, schedule }: ElapsedBadgeProps) {
  const now = useNow();
  if (!since || now === 0) return null;
  const elapsed = sessionDuration({ id: "live", itemId: "live", start: Date.parse(since), end: null }, now, schedule);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary tabular-nums animate-in fade-in-0",
        className,
      )}
      title={schedule ? "Working time since this status started" : "Time running since this status started"}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      <TimerIcon className="size-3" aria-hidden />
      {label ? `${label} · ` : null}
      {formatDuration(elapsed)}
    </span>
  );
}
