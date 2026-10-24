"use client";

import { TimerIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { useNow } from "../hooks";
import { formatDuration } from "../lib/time";

type ElapsedBadgeProps = {
  /** When the current session started (status change time). */
  since: string | null;
  label?: string;
  className?: string;
};

/** Live "⏱ 1h 05m" for an item whose time is currently running. */
export function ElapsedBadge({ since, label, className }: ElapsedBadgeProps) {
  const now = useNow();
  if (!since || now === 0) return null;
  const elapsed = Math.max(0, now - Date.parse(since));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary tabular-nums animate-in fade-in-0",
        className,
      )}
      title="Time running since this status started"
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
