"use client";

import { ChevronDownIcon, FolderKanbanIcon, PartyPopperIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ColorDot } from "@/components/common/color-picker";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { todayIso } from "@/lib/dates";
import type { IssueStatus } from "@/lib/domain";
import { collapseVariants } from "@/lib/motion";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { FocusRow } from "../components/focus-row";
import { NextUpCard } from "../components/next-up-card";
import { useAllIssues, useIssueActions, useProjects } from "../hooks";
import { nextUp, projectDeadline, rankFocus, type FocusItem } from "../lib/focus";
import { positionAtEnd } from "../lib/position";
import type { Issue } from "../types";

const UP_NEXT_LIMIT = 10;

export function FocusContainer() {
  const router = useRouter();
  const projectsQuery = useProjects();
  const { issues, isPending } = useAllIssues(projectsQuery.data);
  const { updateIssue } = useIssueActions();
  const [today] = useState(todayIso);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [showAllUpNext, setShowAllUpNext] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const activeProjects = projects.filter((project) => !project.archived);

  const groups = useMemo(() => {
    const scoped = projectFilter ? issues.filter((issue) => issue.project_id === projectFilter) : issues;
    return rankFocus(scoped, projects, today);
  }, [issues, projects, projectFilter, today]);

  const top = nextUp(groups);
  const without = (items: FocusItem[]) => items.filter((item) => item.issue.id !== top?.issue.id);
  const inProgress = without(groups.inProgress);
  const upNext = without(groups.upNext);
  const backlog = without(groups.backlog);
  const visibleUpNext = showAllUpNext ? upNext : upNext.slice(0, UP_NEXT_LIMIT);

  const openCount = groups.inProgress.length + groups.upNext.length + groups.backlog.length;
  const criticalCount = [...groups.inProgress, ...groups.upNext, ...groups.backlog].filter(
    (item) => item.issue.priority === "critical",
  ).length;
  const dueSoonCount = activeProjects.filter((project) => {
    const deadline = projectDeadline(project, today);
    return deadline?.tone === "overdue" || deadline?.tone === "soon";
  }).length;

  const moveTo = (issue: Issue, status: IssueStatus) => {
    const column = issues.filter((other) => other.project_id === issue.project_id && other.status === status);
    updateIssue(issue.project_id, issue.id, { status, position: positionAtEnd(column.map((other) => other.position)) });
  };

  const start = (item: FocusItem) => moveTo(item.issue, "in_progress");

  const done = (item: FocusItem) => {
    const { issue } = item;
    const previous = { status: issue.status, position: issue.position };
    moveTo(issue, "done");
    toast("Marked done", {
      description: issue.title,
      action: { label: "Undo", onClick: () => updateIssue(issue.project_id, issue.id, previous) },
    });
  };

  const open = (item: FocusItem) => router.push(routes.board(item.issue.project_id, item.issue.id));

  const row = (item: FocusItem, rank: number) => (
    <FocusRow
      key={item.issue.id}
      item={item}
      rank={rank}
      onOpen={() => open(item)}
      onStart={() => start(item)}
      onDone={() => done(item)}
    />
  );

  if (projectsQuery.isSuccess && activeProjects.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Focus" />
        <EmptyState
          icon={FolderKanbanIcon}
          title="No active projects"
          description="Create a project and its issues will be ranked here by what matters most."
          action={
            <Button asChild variant="outline">
              <Link href={routes.projects}>Create a project</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Focus"
        description="Everything open across your projects, ranked by what to do first."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Stat label="open" value={openCount} />
        <Stat label="in progress" value={groups.inProgress.length} />
        <Stat label="critical" value={criticalCount} tone={criticalCount > 0 ? "danger" : undefined} />
        <Stat
          label={dueSoonCount === 1 ? "project due soon" : "projects due soon"}
          value={dueSoonCount}
          tone={dueSoonCount > 0 ? "warning" : undefined}
        />
      </div>

      {activeProjects.length > 1 ? (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Filter by project">
          <FilterChip active={projectFilter === null} onClick={() => setProjectFilter(null)}>
            All projects
          </FilterChip>
          {activeProjects.map((project) => (
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

      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 rounded-[var(--radius)]" />
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-[var(--radius)]" />
          ))}
        </div>
      ) : !top ? (
        <EmptyState
          icon={PartyPopperIcon}
          title="All caught up"
          description={projectFilter ? "This project has no open issues." : "No open issues in any project. Enjoy it."}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <NextUpCard item={top} onOpen={() => open(top)} onStart={() => start(top)} onDone={() => done(top)} />

          {inProgress.length > 0 ? (
            <Section title="In progress" count={inProgress.length} hint="Finish what you started">
              <AnimatePresence initial={false}>{inProgress.map((item, index) => row(item, index + 2))}</AnimatePresence>
            </Section>
          ) : null}

          {upNext.length > 0 ? (
            <Section title="Up next" count={upNext.length}>
              <AnimatePresence initial={false}>
                {visibleUpNext.map((item, index) => row(item, index + 2 + inProgress.length))}
              </AnimatePresence>
              {upNext.length > UP_NEXT_LIMIT ? (
                <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAllUpNext((value) => !value)}>
                  {showAllUpNext ? "Show less" : `Show all ${upNext.length}`}
                </Button>
              ) : null}
            </Section>
          ) : null}

          {backlog.length > 0 ? (
            <section>
              <button
                type="button"
                onClick={() => setShowBacklog((value) => !value)}
                aria-expanded={showBacklog}
                className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDownIcon className={cn("size-4 transition-transform duration-200", !showBacklog && "-rotate-90")} />
                Backlog ({backlog.length})
              </button>
              <AnimatePresence initial={false}>
                {showBacklog ? (
                  <motion.div
                    key="backlog"
                    variants={collapseVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    <ul className="flex flex-col gap-2">
                      <AnimatePresence initial={false}>
                        {backlog.map((item, index) => row(item, index + 2 + inProgress.length + upNext.length))}
                      </AnimatePresence>
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, hint, children }: { title: string; count: number; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 text-sm font-semibold">
        {title}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">{count}</span>
        {hint ? <span className="text-xs font-normal text-muted-foreground">· {hint}</span> : null}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" | "warning" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 transition-colors",
        tone === "danger"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : tone === "warning"
            ? "border-highlight/30 bg-highlight/10 text-highlight"
            : "bg-card text-muted-foreground",
      )}
    >
      <span className="font-semibold text-foreground tabular-nums">{value}</span> {label}
    </span>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
