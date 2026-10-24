"use client";

import { CalendarClockIcon, CircleCheckIcon, CircleIcon } from "lucide-react";
import { useMemo } from "react";

import { DayDetail } from "@/components/calendar/day-detail";
import { MonthCalendar, type CalendarDay } from "@/components/calendar/month-calendar";
import { MonthSummary } from "@/components/calendar/month-summary";
import { ColorDot } from "@/components/common/color-picker";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buildTimeView, monthLabel, useMonthState } from "@/features/time/calendar-view";
import { useEntries, useNow } from "@/features/time/hooks";
import type { ItemInfo } from "@/features/time/lib/time";
import { cn } from "@/lib/utils";

import { useTagMap, useTasks } from "../hooks";

const UNTAGGED = "untagged";

export function CalendarContainer() {
  const { today, month, setMonth, selected, setSelected, weeks, range } = useMonthState();
  const tasksQuery = useTasks();
  const tagMap = useTagMap();
  const entries = useEntries("task", range);
  const now = useNow();

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const view = useMemo(() => {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const titles = new Map((entries.data ?? []).map((row) => [row.task_id ?? "", row.task?.title ?? "Deleted task"]));
    const describe = (itemId: string): ItemInfo => {
      const task = byId.get(itemId);
      const tag = task?.tag_ids.map((id) => tagMap.get(id)).find((candidate) => candidate !== undefined);
      return {
        label: task?.title ?? titles.get(itemId) ?? "Task",
        color: tag?.color ?? "green",
        groupKey: tag?.id ?? UNTAGGED,
        groupLabel: tag?.name ?? "No tag",
      };
    };
    return buildTimeView({
      rows: entries.data ?? [],
      local: tasks.map((task) => ({
        itemId: task.id,
        active: Boolean(task.doing) && !task.completed,
        statusChangedAt: task.status_changed_at ?? null,
      })),
      describe,
      now,
      month,
    });
  }, [entries.data, tasks, tagMap, now, month]);

  // Due markers: tasks due on each date (red when overdue and still open).
  const cells = useMemo(() => {
    const merged = new Map<string, CalendarDay>(view.cells);
    const due = new Map<string, { count: number; overdue: boolean }>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const entry = due.get(task.due_date) ?? { count: 0, overdue: false };
      entry.count += 1;
      entry.overdue ||= !task.completed && task.due_date < today;
      due.set(task.due_date, entry);
    }
    for (const [date, { count, overdue }] of due) {
      const cell = merged.get(date) ?? { dots: [] };
      merged.set(date, { ...cell, marker: { count, tone: overdue ? "overdue" : "due" } });
    }
    return merged;
  }, [view.cells, tasks, today]);

  const dueOnSelected = tasks.filter((task) => task.due_date === selected);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Calendar" description="What you worked on each day, and what's due." />

      {entries.isPending && tasksQuery.isPending ? (
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <MonthCalendar
            month={month}
            weeks={weeks}
            days={cells}
            today={today}
            selected={selected}
            onSelect={setSelected}
            onMonthChange={setMonth}
          />
          <div className="flex flex-col gap-4">
            <DayDetail
              date={selected}
              summary={view.days.get(selected)}
              emptyLabel="No time tracked. Tap ▶ Mulai on a task to start tracking."
            >
              {dueOnSelected.length > 0 ? (
                <div className="flex flex-col gap-1.5 border-t pt-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                    <CalendarClockIcon className="size-3.5" />
                    Due
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {dueOnSelected.map((task) => {
                      const tag = task.tag_ids.map((id) => tagMap.get(id)).find((candidate) => candidate !== undefined);
                      const overdue = !task.completed && selected < today;
                      return (
                        <li key={task.id} className="flex items-center gap-2 text-sm">
                          {task.completed ? (
                            <CircleCheckIcon className="size-4 text-primary" aria-label="Done" />
                          ) : (
                            <CircleIcon className={cn("size-4", overdue ? "text-destructive" : "text-muted-foreground")} aria-label="Open" />
                          )}
                          <span className={cn("min-w-0 flex-1 truncate", task.completed && "text-muted-foreground line-through")}>
                            {task.title}
                          </span>
                          {tag ? <ColorDot color={tag.color} /> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </DayDetail>
            <MonthSummary
              title={`${monthLabel(month)} by tag`}
              totalMs={view.totalMs}
              activeDays={view.activeDays}
              groups={view.groups}
              emptyLabel="Nothing tracked this month yet."
            />
          </div>
        </div>
      )}
    </div>
  );
}
