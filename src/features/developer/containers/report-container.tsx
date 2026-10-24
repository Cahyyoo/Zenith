"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DayDetail } from "@/components/calendar/day-detail";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { MonthSummary } from "@/components/calendar/month-summary";
import { ColorDot } from "@/components/common/color-picker";
import { FilterChip } from "@/components/common/filter-chip";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buildTimeView, monthLabel, useMonthState } from "@/features/time/calendar-view";
import { useEntries, useNow } from "@/features/time/hooks";
import { formatDuration, type ItemInfo } from "@/features/time/lib/time";
import { routes } from "@/lib/routes";

import { issueDisplayId } from "../components/issue-meta";
import { useAllIssues, useProjects } from "../hooks";

export function ReportContainer() {
  const router = useRouter();
  const { today, month, setMonth, selected, setSelected, weeks, range } = useMonthState();
  const projectsQuery = useProjects();
  const { issues } = useAllIssues(projectsQuery.data);
  const entries = useEntries("issue", range);
  const now = useNow();
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  // Where each tracked issue lives, preferring the local (freshest) copy.
  const issueInfo = useMemo(() => {
    const info = new Map<string, { title: string; number: number | null; projectId: string }>();
    for (const row of entries.data ?? []) {
      if (row.issue) info.set(row.issue.id, { title: row.issue.title, number: row.issue.number, projectId: row.issue.project_id });
    }
    for (const issue of issues) info.set(issue.id, { title: issue.title, number: issue.number, projectId: issue.project_id });
    return info;
  }, [entries.data, issues]);

  const view = useMemo(() => {
    const describe = (itemId: string): ItemInfo | undefined => {
      const issue = issueInfo.get(itemId);
      if (!issue || (projectFilter && issue.projectId !== projectFilter)) return undefined;
      const project = projectById.get(issue.projectId);
      return {
        label: issue.title,
        meta: project ? issueDisplayId(project.key, issue.number) : undefined,
        color: project?.color ?? "slate",
        groupKey: issue.projectId,
        groupLabel: project?.name ?? "Unknown project",
      };
    };
    return buildTimeView({
      rows: entries.data ?? [],
      local: issues.map((issue) => ({
        itemId: issue.id,
        active: issue.status === "in_progress",
        statusChangedAt: issue.status_changed_at ?? null,
      })),
      describe,
      now,
      month,
    });
  }, [entries.data, issues, issueInfo, projectById, projectFilter, now, month]);

  const trackedProjects = projects.filter((project) =>
    [...issueInfo.values()].some((issue) => issue.projectId === project.id),
  );

  // Top issues of the month, across days.
  const topIssues = useMemo(() => {
    const totals = new Map<string, { itemId: string; label: string; meta?: string; ms: number }>();
    for (const day of view.days.values()) {
      if (day.date.slice(0, 7) !== `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`) continue;
      for (const item of day.items) {
        const total = totals.get(item.itemId) ?? { itemId: item.itemId, label: item.label, meta: item.meta, ms: 0 };
        total.ms += item.ms;
        totals.set(item.itemId, total);
      }
    }
    return [...totals.values()].sort((a, b) => b.ms - a.ms).slice(0, 5);
  }, [view.days, month]);

  const openIssue = (itemId: string) => {
    const issue = issueInfo.get(itemId);
    if (issue) router.push(routes.board(issue.projectId, itemId));
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Report" description="Which issues you worked on, day by day. Time runs while an issue is In Progress." />

      {trackedProjects.length > 1 ? (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Filter by project">
          <FilterChip active={projectFilter === null} onClick={() => setProjectFilter(null)}>
            All projects
          </FilterChip>
          {trackedProjects.map((project) => (
            <FilterChip
              key={project.id}
              active={projectFilter === project.id}
              onClick={() => setProjectFilter(projectFilter === project.id ? null : project.id)}
            >
              <ColorDot color={project.color} className="size-2" />
              {project.name}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {entries.isPending ? (
        <Skeleton className="h-96 rounded-[var(--radius)]" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <MonthCalendar
            month={month}
            weeks={weeks}
            days={view.cells}
            today={today}
            selected={selected}
            onSelect={setSelected}
            onMonthChange={setMonth}
          />
          <div className="flex flex-col gap-4">
            <DayDetail
              date={selected}
              summary={view.days.get(selected)}
              emptyLabel="Nothing tracked. Move an issue to In Progress to start its time."
              onItemClick={openIssue}
            />
            <MonthSummary
              title={`${monthLabel(month)} by project`}
              totalMs={view.totalMs}
              activeDays={view.activeDays}
              groups={view.groups}
              emptyLabel="Nothing tracked this month yet."
            />
            {topIssues.length > 0 ? (
              <section aria-label="Top issues" className="flex flex-col gap-2 rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4">
                <h2 className="text-sm font-semibold">Top issues</h2>
                <ol className="flex flex-col gap-1">
                  {topIssues.map((issue, index) => (
                    <li key={issue.itemId}>
                      <button
                        type="button"
                        onClick={() => openIssue(issue.itemId)}
                        className="flex w-full items-center gap-2 rounded-[var(--radius)] px-1.5 py-1 text-left text-sm transition-colors hover:bg-muted/60"
                      >
                        <span className="w-4 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                        {issue.meta ? <span className="font-mono text-[11px] text-muted-foreground">{issue.meta}</span> : null}
                        <span className="min-w-0 flex-1 truncate">{issue.label}</span>
                        <span className="text-xs tabular-nums">{formatDuration(issue.ms)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
