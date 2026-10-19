import type { QueryClient } from "@tanstack/react-query";

import { defineMutation } from "@/lib/query/define-mutation";

import * as api from "./api";
import { developerKeys } from "./keys";
import { rebalancedPositions } from "./lib/position";
import type {
  CreateIssueVars,
  CreateProjectVars,
  RebalanceColumnVars,
  UpdateIssueVars,
  UpdateProjectVars,
} from "./schemas";
import type { Issue, Project } from "./types";

type ProjectsSnapshot = { projects: Project[] | undefined };
type IssuesSnapshot = { projectId: string; issues: Issue[] | undefined };

function snapshotProjects(client: QueryClient): ProjectsSnapshot {
  return { projects: client.getQueryData<Project[]>(developerKeys.projects()) };
}

function updateProjects(client: QueryClient, updater: (projects: Project[]) => Project[]) {
  client.setQueryData<Project[]>(developerKeys.projects(), (projects) => updater(projects ?? []));
}

function snapshotIssues(client: QueryClient, projectId: string): IssuesSnapshot {
  return { projectId, issues: client.getQueryData<Issue[]>(developerKeys.issues(projectId)) };
}

function restoreIssues(client: QueryClient, snapshot: IssuesSnapshot) {
  client.setQueryData(developerKeys.issues(snapshot.projectId), snapshot.issues);
}

function updateIssues(client: QueryClient, projectId: string, updater: (issues: Issue[]) => Issue[]) {
  client.setQueryData<Issue[]>(developerKeys.issues(projectId), (issues) =>
    updater(issues ?? []).sort((a, b) => a.position - b.position),
  );
}

export const createProjectMutation = defineMutation<CreateProjectVars, ProjectsSnapshot>(
  ["developer", "projects", "create"],
  {
    mutationFn: api.insertProject,
    invalidates: () => [developerKeys.projects()],
    optimistic: (client, vars) => {
      const snapshot = snapshotProjects(client);
      updateProjects(client, (projects) => [
        ...projects.filter((p) => p.id !== vars.id),
        { ...vars, user_id: "", archived: false, updated_at: vars.created_at },
      ]);
      return snapshot;
    },
    rollback: (client, snapshot) => client.setQueryData(developerKeys.projects(), snapshot.projects),
  },
);

export const updateProjectMutation = defineMutation<UpdateProjectVars, ProjectsSnapshot>(
  ["developer", "projects", "update"],
  {
    mutationFn: api.updateProject,
    invalidates: () => [developerKeys.projects()],
    optimistic: (client, { id, patch }) => {
      const snapshot = snapshotProjects(client);
      updateProjects(client, (projects) =>
        projects.map((project) => (project.id === id ? { ...project, ...patch } : project)),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => client.setQueryData(developerKeys.projects(), snapshot.projects),
  },
);

export const deleteProjectMutation = defineMutation<{ id: string }, ProjectsSnapshot>(
  ["developer", "projects", "delete"],
  {
    mutationFn: ({ id }) => api.deleteProject(id),
    invalidates: () => [developerKeys.projects()],
    optimistic: (client, { id }) => {
      const snapshot = snapshotProjects(client);
      updateProjects(client, (projects) => projects.filter((project) => project.id !== id));
      client.removeQueries({ queryKey: developerKeys.issues(id) });
      return snapshot;
    },
    rollback: (client, snapshot) => client.setQueryData(developerKeys.projects(), snapshot.projects),
  },
);

export const createIssueMutation = defineMutation<CreateIssueVars, IssuesSnapshot>(
  ["developer", "issues", "create"],
  {
    mutationFn: api.insertIssue,
    invalidates: (vars) => [developerKeys.issues(vars.project_id)],
    optimistic: (client, vars) => {
      const snapshot = snapshotIssues(client, vars.project_id);
      updateIssues(client, vars.project_id, (issues) => [
        ...issues.filter((issue) => issue.id !== vars.id),
        { ...vars, user_id: "", number: null, updated_at: vars.created_at },
      ]);
      return snapshot;
    },
    rollback: (client, snapshot) => restoreIssues(client, snapshot),
  },
);

/** Field edits and drag-and-drop moves (status + position) both go through here. */
export const updateIssueMutation = defineMutation<UpdateIssueVars, IssuesSnapshot>(
  ["developer", "issues", "update"],
  {
    mutationFn: api.updateIssue,
    invalidates: (vars) => [developerKeys.issues(vars.project_id)],
    optimistic: (client, { id, project_id, patch }) => {
      const snapshot = snapshotIssues(client, project_id);
      const now = new Date().toISOString();
      updateIssues(client, project_id, (issues) =>
        issues.map((issue) => (issue.id === id ? { ...issue, ...patch, updated_at: now } : issue)),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => restoreIssues(client, snapshot),
  },
);

export const deleteIssueMutation = defineMutation<{ id: string; project_id: string }, IssuesSnapshot>(
  ["developer", "issues", "delete"],
  {
    mutationFn: ({ id }) => api.deleteIssue(id),
    invalidates: (vars) => [developerKeys.issues(vars.project_id)],
    optimistic: (client, { id, project_id }) => {
      const snapshot = snapshotIssues(client, project_id);
      updateIssues(client, project_id, (issues) => issues.filter((issue) => issue.id !== id));
      return snapshot;
    },
    rollback: (client, snapshot) => restoreIssues(client, snapshot),
  },
);

export const rebalanceColumnMutation = defineMutation<RebalanceColumnVars, IssuesSnapshot>(
  ["developer", "issues", "rebalance"],
  {
    mutationFn: api.rebalanceColumn,
    invalidates: (vars) => [developerKeys.issues(vars.project_id)],
    optimistic: (client, { project_id, status, ordered_ids }) => {
      const snapshot = snapshotIssues(client, project_id);
      const positions = rebalancedPositions(ordered_ids.length);
      const nextPosition = new Map(ordered_ids.map((id, index) => [id, positions[index] ?? 0]));
      updateIssues(client, project_id, (issues) =>
        issues.map((issue) => {
          const position = nextPosition.get(issue.id);
          return position === undefined ? issue : { ...issue, status, position };
        }),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => restoreIssues(client, snapshot),
  },
);

export const developerMutations = [
  createProjectMutation,
  updateProjectMutation,
  deleteProjectMutation,
  createIssueMutation,
  updateIssueMutation,
  deleteIssueMutation,
  rebalanceColumnMutation,
];
