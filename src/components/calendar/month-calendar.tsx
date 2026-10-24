"use client";

import { addMonths, format, isSameMonth, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { COLOR_CLASSES, type TagColor } from "@/lib/domain";
import { EASE_OUT, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type CalendarDay = {
  totalLabel?: string;
  /** Dots for what was worked on, most time first. */
  dots: { key: string; color: TagColor }[];
  /** Optional marker, e.g. tasks due that day. */
  marker?: { count: number; tone: "due" | "overdue" };
};

type MonthCalendarProps = {
  month: Date;
  weeks: string[][];
  days: ReadonlyMap<string, CalendarDay>;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
  onMonthChange: (month: Date) => void;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_DOTS = 3;

export function MonthCalendar({ month, weeks, days, today, selected, onSelect, onMonthChange }: MonthCalendarProps) {
  // Slide direction follows navigation: next month enters from the right.
  const [direction, setDirection] = useState(1);
  const go = (delta: number) => {
    setDirection(delta);
    onMonthChange(addMonths(month, delta));
  };
  const goToday = () => {
    const now = parseISO(today);
    setDirection(now > month ? 1 : -1);
    onMonthChange(now);
    onSelect(today);
  };

  return (
    <section aria-label="Calendar" className="overflow-hidden rounded-[calc(var(--radius)+0.25rem)] border bg-card">
      <header className="flex items-center gap-1 border-b px-3 py-2">
        <h2 className="mr-auto text-sm font-semibold" aria-live="polite">
          {format(month, "MMMM yyyy")}
        </h2>
        <Button variant="ghost" size="sm" onClick={goToday} disabled={isSameMonth(month, parseISO(today)) && selected === today}>
          Today
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => go(-1)} aria-label="Previous month">
          <ChevronLeftIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => go(1)} aria-label="Next month">
          <ChevronRightIcon />
        </Button>
      </header>

      <div className="grid grid-cols-7 border-b text-center text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1.5">
            {day}
          </span>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={format(month, "yyyy-MM")}
          custom={direction}
          variants={{
            enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
            center: { opacity: 1, x: 0 },
            exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: EASE_OUT }}
          role="grid"
          className="grid grid-cols-7"
        >
          {weeks.flat().map((date) => {
            const day = days.get(date);
            const inMonth = isSameMonth(parseISO(date), month);
            const isSelected = date === selected;
            const isToday = date === today;
            const extraDots = (day?.dots.length ?? 0) - MAX_DOTS;
            return (
              <button
                key={date}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${format(parseISO(date), "EEEE, MMMM d")}${day?.totalLabel ? `, ${day.totalLabel} tracked` : ""}${day?.marker ? `, ${day.marker.count} due` : ""}`}
                onClick={() => onSelect(date)}
                className={cn(
                  "relative flex min-h-16 flex-col items-stretch gap-1 border-b border-r p-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:min-h-20 sm:p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-muted/40 text-muted-foreground/60",
                  inMonth && "hover:bg-muted/50",
                )}
              >
                {isSelected ? (
                  <motion.span
                    layoutId="calendar-selected-day"
                    transition={spring.snappy}
                    className="absolute inset-0.5 rounded-[calc(var(--radius)-0.125rem)] bg-primary/10 ring-1 ring-primary/40"
                  />
                ) : null}
                <span className="relative flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isToday && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {Number(date.slice(8))}
                  </span>
                  {day?.marker ? (
                    <span
                      className={cn(
                        "rounded-full px-1 text-[9px] leading-4 font-semibold tabular-nums",
                        day.marker.tone === "overdue" ? "bg-destructive/15 text-destructive" : "bg-highlight/15 text-highlight",
                      )}
                    >
                      {day.marker.count}
                    </span>
                  ) : null}
                </span>
                {day?.totalLabel ? (
                  <span className="relative mt-auto flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold tabular-nums sm:text-[11px]">{day.totalLabel}</span>
                    <span className="flex items-center gap-0.5">
                      {day.dots.slice(0, MAX_DOTS).map((dot) => (
                        <span key={dot.key} className={cn("size-1.5 rounded-full sm:size-2", COLOR_CLASSES[dot.color].dot)} />
                      ))}
                      {extraDots > 0 ? <span className="text-[9px] text-muted-foreground">+{extraDots}</span> : null}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
