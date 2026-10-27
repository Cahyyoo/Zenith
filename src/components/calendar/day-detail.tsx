"use client";

import { format, parseISO } from "date-fns";
import { ClockIcon, LayersIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { ColorDot } from "@/components/common/color-picker";
import { formatDuration, type DaySummary, type Segment } from "@/features/time/lib/time";
import { EASE_OUT, listItemVariants } from "@/lib/motion";

type DayDetailProps = {
  date: string;
  summary: DaySummary | undefined;
  emptyLabel: string;
  onItemClick?: (itemId: string) => void;
  /** Extra content under the worked items, e.g. tasks due that day. */
  children?: ReactNode;
};

function formatSegment(segment: Segment): string {
  const start = format(segment.start, "HH:mm");
  return segment.running ? `${start}–now` : `${start}–${format(segment.end, "HH:mm")}`;
}

/** What was worked on during one day, with durations and time ranges. */
export function DayDetail({ date, summary, emptyLabel, onItemClick, children }: DayDetailProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={date}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        aria-label={`Details for ${date}`}
        className="flex flex-col gap-3 rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4"
      >
        <header className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">{format(parseISO(date), "EEEE, d MMMM")}</h2>
          {summary ? (
            <span className="flex items-center gap-1 text-sm font-medium tabular-nums">
              <ClockIcon className="size-3.5 text-muted-foreground" />
              {formatDuration(summary.totalMs)}
            </span>
          ) : null}
        </header>

        {summary && summary.overlapMs > 60_000 ? (
          <p className="-mt-1 flex items-center gap-1.5 rounded-[var(--radius)] bg-muted/60 px-2 py-1.5 text-[11px] text-muted-foreground">
            <LayersIcon className="size-3.5 shrink-0" />
            {summary.items.length} items overlapped for {formatDuration(summary.overlapMs)} — the day total counts that time once.
          </p>
        ) : null}

        {summary && summary.items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {summary.items.map((item) => {
              const share = summary.totalMs > 0 ? (item.ms / summary.totalMs) * 100 : 0;
              const content = (
                <>
                  <span className="flex items-center gap-2">
                    <ColorDot color={item.color} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>
                    <span className="text-sm tabular-nums">{formatDuration(item.ms)}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-[18px] text-[11px] text-muted-foreground">
                    {item.meta ? <span className="font-mono">{item.meta}</span> : null}
                    <span>{item.groupLabel}</span>
                    <span className="tabular-nums">{item.segments.map(formatSegment).join(", ")}</span>
                  </span>
                  <span className="ml-[18px] h-1 overflow-hidden rounded-full bg-muted">
                    <motion.span
                      className="block h-full rounded-full bg-primary/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                    />
                  </span>
                </>
              );
              return (
                <motion.li key={item.itemId} variants={listItemVariants} initial="initial" animate="animate">
                  {onItemClick ? (
                    <button
                      type="button"
                      onClick={() => onItemClick(item.itemId)}
                      className="flex w-full flex-col gap-1 rounded-[var(--radius)] p-1.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1 p-1.5">{content}</div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}

        {children}
      </motion.section>
    </AnimatePresence>
  );
}
