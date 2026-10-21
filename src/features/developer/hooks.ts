"use client";

import { skipToken, useQueries, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type { IssueStatus } from "@/lib/domain";
import { useDefinedMutation } from "@/lib/query/define-mutation";

import { fetchIssues, fetchProjects, normalizeProjects } from "./api";
import { developerKeys } from "./keys";
import {
  createIssueMutation,
  createProjectMutation,
  deleteIssueMutation,
  deleteProjectMutation,
  rebalanceColumnMutation,
  updateIssueMutation,
  updateProjectMutation,
} from "./mutations";
import type { IssueFormValues, ProjectFormValues, UpdateIssueVars } from "./schemas";
import type { Issue, Project } from "./types";

export function useProjects() {
  return useQuery({ queryKey: developerKeys.projects(), queryFn: fetchProjects, select: normalizeProjects });
}

export function useIssues(projectId: string | null) {
  return useQuery({
    queryKey: developerKeys.issues(projectId ?? "none"),
    queryFn: projectId ? () => fetchIssues(projectId) : skipToken,
  });
}

/**
 * Issues of every active project, for cross-project views (Focus, project
 * stats). Uses the board's own query per project, so the cache, optimistic
 * updates and offline persistence are shared with the Kanban board.
 */
export function useAllIssues(projects: readonly Project[] | undefined) {
  const active = useMemo(() => (projects ?? []).filter((project) => !project.archived), [projects]);
  const combined = useQueries({
    queries: active.map((project) => ({
      queryKey: developerKeys.issues(project.id),
      queryFn: () => fetchIssues(project.id),
    })),
    // `combine` is memoized by TanStack Query, so `issues` keeps its identity
    // until one of the underlying queries actually changes.
    combine: (results): { issues: Issue[]; isPending: boolean } => ({
      issues: results.flatMap((result) => result.data ?? []),
      isPending: results.some((result) => result.isPending),
    }),
  });

  return { issues: combined.issues, isPending: projects === undefined || combined.isPending };
}

export function useProjectActions() {
  const { mutate: create } = useDefinedMutation(createProjectMutation);
  const { mutate: update } = useDefinedMutation(updateProjectMutation);
  const { mutate: remove } = useDefinedMutation(deleteProjectMutation);

  return {
    createProject: useCallback(
      (values: ProjectFormValues) => {
        const id = crypto.randomUUID();
        create({ ...values, id, created_at: new Date().toISOString() });
        return id;
      },
      [create],
    ),
    updateProject: useCallback(
      (id: string, patch: Partial<ProjectFormValues> & { archived?: boolean }) =>
        update({ id, patch }),
      [update],
    ),
    deleteProject: useCallback((id: string) => remove({ id }), [remove]),
  };
}

export function useIssueActions() {
  const { mutate: create } = useDefinedMutation(createIssueMutation);
  const { mutate: update } = useDefinedMutation(updateIssueMutation);
  const { mutate: remove } = useDefinedMutation(deleteIssueMutation);
  const { mutate: rebalance } = useDefinedMutation(rebalanceColumnMutation);

  return {
    createIssue: useCallback(
      (values: IssueFormValues, position: number) =>
        create({ ...values, position, id: crypto.randomUUID(), created_at: new Date().toISOString() }),
      [create],
    ),
    updateIssue: useCallback(
      (projectId: string, id: string, patch: UpdateIssueVars["patch"]) =>
        update({ id, project_id: projectId, patch }),
      [update],
    ),
    deleteIssue: useCallback(
      (projectId: string, id: string) => remove({ id, project_id: projectId }),
      [remove],
    ),
    rebalanceColumn: useCallback(
      (projectId: string, status: IssueStatus, orderedIds: string[]) =>
        rebalance({ project_id: projectId, status, ordered_ids: orderedIds }),
      [rebalance],
    ),
  };
}
