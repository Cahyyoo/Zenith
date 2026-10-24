"use client";

import { FolderKanbanIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { routes } from "@/lib/routes";
import { ISSUE_STATUSES, ISSUE_TYPES, ISSUE_TYPE_LABEL, type IssueStatus, type IssueType } from "@/lib/domain";
import { toSession } from "@/features/time/api";
import { TimeTracked } from "@/features/time/components/time-tracked";
import { useItemEntries, useNow } from "@/features/time/hooks";
import { closeLocallyStopped, mergeLocalRunning } from "@/features/time/lib/time";
import { useWorkspaceStore } from "@/stores/workspace";

import { BoardContext } from "../components/board-context";
import { IssueDetailSheet } from "../components/issue-detail-sheet";
import { IssueForm } from "../components/issue-form";
import { TypeIcon } from "../components/issue-meta";
import { KanbanBoard } from "../components/kanban-board";
import { useIssueActions, useIssues, useProjects } from "../hooks";
import { positionAtEnd } from "../lib/position";

export function BoardContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const issueId = searchParams.get("issue");

  const projectsQuery = useProjects();
  const issuesQuery = useIssues(projectId);
  const actions = useIssueActions();
  const setLastProjectId = useWorkspaceStore((state) => state.setLastProjectId);

  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<IssueType[]>([]);
  const [creatingIn, setCreatingIn] = useState<IssueStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = projectsQuery.data?.find((p) => p.id === projectId);

  // Time tracked for the issue open in the sheet, including unsynced local changes.
  const issueEntries = useItemEntries("issue", issueId);
  const now = useNow();
  const sheetIssue = issueId ? issuesQuery.data?.find((issue) => issue.id === issueId) : undefined;
  const sheetSessions = useMemo(() => {
    if (!sheetIssue) return [];
    const server = (issueEntries.data ?? []).map(toSession);
    const changedAt = sheetIssue.status_changed_at ?? null;
    return sheetIssue.status === "in_progress"
      ? mergeLocalRunning(server, [{ itemId: sheetIssue.id, since: changedAt }])
      : closeLocallyStopped(server, new Map([[sheetIssue.id, changedAt]]));
  }, [issueEntries.data, sheetIssue]);

  useEffect(() => {
    if (project) setLastProjectId(project.id);
  }, [project, setLastProjectId]);

  const allIssues = useMemo(() => issuesQuery.data ?? [], [issuesQuery.data]);
  const visibleIssues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allIssues.filter(
      (issue) =>
        (types.length === 0 || types.includes(issue.type)) &&
        (!needle || issue.title.toLowerCase().includes(needle)),
    );
  }, [allIssues, query, types]);

  const boardContext = useMemo(
    () => ({
      projectKey: project?.key ?? "",
      onOpenIssue: (id: string) => {
        if (projectId) router.replace(routes.board(projectId, id), { scroll: false });
      },
      onAddIssue: (status: IssueStatus) => setCreatingIn(status),
    }),
    [project?.key, projectId, router],
  );

  if (!projectId || (projectsQuery.isSuccess && !project)) {
    return (
      <EmptyState
        icon={FolderKanbanIcon}
        title={projectId ? "Project not found" : "Pick a project"}
        description="Open a project to see its board."
        action={
          <Button asChild variant="outline">
            <Link href={routes.projects}>View projects</Link>
          </Button>
        }
      />
    );
  }

  const openIssue = issueId ? allIssues.find((issue) => issue.id === issueId) : undefined;
  const closeIssue = () => router.replace(routes.board(projectId), { scroll: false });
  const nextPosition = (status: IssueStatus) =>
    positionAtEnd(allIssues.filter((issue) => issue.status === status).map((issue) => issue.position));

  return (
    <BoardContext value={boardContext}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto min-w-0">
            <p className="font-mono text-xs text-muted-foreground">{project?.key ?? "…"}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight">{project?.name ?? "Loading…"}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter issues"
              aria-label="Filter issues by title"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={types}
            onValueChange={(value) => setTypes(ISSUE_TYPES.filter((type) => value.includes(type)))}
            aria-label="Filter by type"
          >
            {ISSUE_TYPES.map((type) => (
              <ToggleGroupItem key={type} value={type} aria-label={ISSUE_TYPE_LABEL[type]} className="gap-1 px-2 text-xs">
                <TypeIcon type={type} />
                <span className="hidden sm:inline">{ISSUE_TYPE_LABEL[type]}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {issuesQuery.isPending ? (
          <div className="flex gap-3 overflow-hidden">
            {ISSUE_STATUSES.map((status) => (
              <Skeleton key={status} className="h-72 w-72 shrink-0 rounded-[var(--radius)] lg:flex-1" />
            ))}
          </div>
        ) : (
          <KanbanBoard
            issues={visibleIssues}
            projectKey={project?.key ?? ""}
            onDrop={(id, result) => {
              if (result.kind === "move") {
                actions.updateIssue(projectId, id, { status: result.status, position: result.position });
              } else {
                // A column change goes through updateIssue first so it carries
                // the status timestamp used for time tracking.
                const moved = allIssues.find((issue) => issue.id === id);
                if (moved && moved.status !== result.status) {
                  actions.updateIssue(projectId, id, { status: result.status });
                }
                actions.rebalanceColumn(projectId, result.status, result.orderedIds);
              }
            }}
          />
        )}
      </div>

      <ResponsiveDialog
        open={creatingIn !== null}
        onOpenChange={(open) => {
          if (!open) setCreatingIn(null);
        }}
        title="New issue"
        className="sm:max-w-2xl"
      >
        {creatingIn ? (
          <IssueForm
            submitLabel="Create issue"
            defaultValues={{
              project_id: projectId,
              title: "",
              description_md: "",
              type: "feature",
              priority: "medium",
              status: creatingIn,
            }}
            onSubmit={(values) => {
              actions.createIssue(values, nextPosition(values.status));
              setCreatingIn(null);
            }}
          />
        ) : null}
      </ResponsiveDialog>

      <IssueDetailSheet
        issue={openIssue}
        projectKey={project?.key ?? ""}
        onClose={closeIssue}
        onSave={(values) => {
          if (!openIssue) return;
          const { project_id: _projectId, ...patch } = values;
          const moved = patch.status !== openIssue.status;
          actions.updateIssue(projectId, openIssue.id, moved ? { ...patch, position: nextPosition(patch.status) } : patch);
          closeIssue();
        }}
        onDelete={() => setConfirmDelete(true)}
        timeTracked={<TimeTracked sessions={sheetSessions} now={now} />}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this issue?"
        description="This permanently removes the issue and its description."
        confirmLabel="Delete issue"
        onConfirm={() => {
          if (openIssue) actions.deleteIssue(projectId, openIssue.id);
          setConfirmDelete(false);
          closeIssue();
        }}
      />
    </BoardContext>
  );
}
