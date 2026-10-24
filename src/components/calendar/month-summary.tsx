"use client";

import { motion } from "motion/react";

import { formatDuration, type GroupTotal } from "@/features/time/lib/time";
import { COLOR_CLASSES } from "@/lib/domain";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MonthSummaryProps = {
  title: string;
  totalMs: number;
  activeDays: number;
  groups: GroupTotal[];
  emptyLabel: string;
};

/** Monthly total and a bar per group (project or tag). */
export function MonthSummary({ title, totalMs, activeDays, groups, emptyLabel }: MonthSummaryProps) {
  const max = groups[0]?.ms ?? 0;

  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="text-base font-semibold text-foreground">{formatDuration(totalMs)}</span> · {activeDays}{" "}
          {activeDays === 1 ? "day" : "days"}
        </span>
      </header>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {groups.map((group) => (
            <li key={group.key} className="flex flex-col gap-1">
              <span className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{group.label}</span>
                <span className="text-muted-foreground tabular-nums">{formatDuration(group.ms)}</span>
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className={cn("block h-full rounded-full", COLOR_CLASSES[group.color].dot)}
                  initial={{ width: 0 }}
                  animate={{ width: `${max > 0 ? (group.ms / max) * 100 : 0}%` }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
