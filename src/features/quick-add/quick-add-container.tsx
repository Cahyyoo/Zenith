"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { IssueForm } from "@/features/developer/components/issue-form";
import { useIssueActions, useProjects } from "@/features/developer/hooks";
import { developerKeys } from "@/features/developer/keys";
import { positionAtEnd } from "@/features/developer/lib/position";
import type { Issue } from "@/features/developer/types";
import { TaskForm } from "@/features/personal/components/task-form";
import { useTags, useTaskActions } from "@/features/personal/hooks";
import type { Workspace } from "@/lib/domain";
import { routes } from "@/lib/routes";
import { useUiStore } from "@/stores/ui";
import { useWorkspaceStore } from "@/stores/workspace";

/** The global "+" flow, opened from the FAB or header buttons. */
export function QuickAddContainer({ workspace }: { workspace: Workspace }) {
  const open = useUiStore((state) => state.quickAddOpen);
  const setOpen = useUiStore((state) => state.setQuickAddOpen);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={workspace === "personal" ? "New task" : "New issue"}
      className={workspace === "developer" ? "sm:max-w-2xl" : undefined}
    >
      {open ? (
        workspace === "personal" ? (
          <QuickAddTask onDone={() => setOpen(false)} />
        ) : (
          <QuickAddIssue onDone={() => setOpen(false)} />
        )
      ) : null}
    </ResponsiveDialog>
  );
}

function QuickAddTask({ onDone }: { onDone: () => void }) {
  const { data: tags = [] } = useTags();
  const { createTask } = useTaskActions();

  return (
    <TaskForm
      tags={tags}
      submitLabel="Add task"
      onSubmit={(values) => {
        createTask(values);
        onDone();
      }}
    />
  );
}

function QuickAddIssue({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const { data: projects = [] } = useProjects();
  const lastProjectId = useWorkspaceStore((state) => state.lastProjectId);
  const { createIssue } = useIssueActions();

  const available = projects.filter((project) => !project.archived);

  if (available.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 pb-2">
        <p className="text-sm text-muted-foreground">Issues live inside projects. Create a project first.</p>
        <Button asChild onClick={onDone}>
          <Link href={routes.projects}>Go to projects</Link>
        </Button>
      </div>
    );
  }

  const defaultProject = available.find((project) => project.id === lastProjectId) ?? available[0];

  return (
    <IssueForm
      projects={available}
      submitLabel="Create issue"
      defaultValues={{
        project_id: defaultProject?.id ?? "",
        title: "",
        description_md: "",
        type: "feature",
        priority: "medium",
        status: "todo",
      }}
      onSubmit={(values) => {
        const siblings = queryClient.getQueryData<Issue[]>(developerKeys.issues(values.project_id)) ?? [];
        const position = positionAtEnd(
          siblings.filter((issue) => issue.status === values.status).map((issue) => issue.position),
        );
        createIssue(values, position);
        onDone();
      }}
    />
  );
}
