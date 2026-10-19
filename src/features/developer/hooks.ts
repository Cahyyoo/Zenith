"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { IssueStatus } from "@/lib/domain";
import { useDefinedMutation } from "@/lib/query/define-mutation";

import { fetchIssues, fetchProjects } from "./api";
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

export function useProjects() {
  return useQuery({ queryKey: developerKeys.projects(), queryFn: fetchProjects });
}

export function useIssues(projectId: string | null) {
  return useQuery({
    queryKey: developerKeys.issues(projectId ?? "none"),
    queryFn: projectId ? () => fetchIssues(projectId) : skipToken,
  });
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
