import type { QueryClient } from "@tanstack/react-query";

import { defineMutation } from "@/lib/query/define-mutation";

import * as api from "./api";
import { personalKeys } from "./keys";
import type { CreateTagVars, CreateTaskVars, UpdateTagVars, UpdateTaskVars } from "./schemas";
import type { Tag, Task } from "./types";

type TaskSnapshot = { tasks: Task[] | undefined };
type TagSnapshot = { tags: Task[] | undefined; tagList: Tag[] | undefined };

function snapshotTasks(client: QueryClient): TaskSnapshot {
  return { tasks: client.getQueryData<Task[]>(personalKeys.tasks()) };
}

function restoreTasks(client: QueryClient, snapshot: TaskSnapshot) {
  client.setQueryData(personalKeys.tasks(), snapshot.tasks);
}

function updateTasks(client: QueryClient, updater: (tasks: Task[]) => Task[]) {
  client.setQueryData<Task[]>(personalKeys.tasks(), (tasks) => updater(tasks ?? []));
}

function snapshotTags(client: QueryClient): TagSnapshot {
  return {
    tags: client.getQueryData<Task[]>(personalKeys.tasks()),
    tagList: client.getQueryData<Tag[]>(personalKeys.tags()),
  };
}

function restoreTags(client: QueryClient, snapshot: TagSnapshot) {
  client.setQueryData(personalKeys.tasks(), snapshot.tags);
  client.setQueryData(personalKeys.tags(), snapshot.tagList);
}

const taskQueries = () => [personalKeys.tasks()];
const tagQueries = () => [personalKeys.tags(), personalKeys.tasks()];

export const createTaskMutation = defineMutation<CreateTaskVars, TaskSnapshot>(
  ["personal", "tasks", "create"],
  {
    mutationFn: api.insertTask,
    invalidates: taskQueries,
    optimistic: (client, vars) => {
      const snapshot = snapshotTasks(client);
      const now = vars.created_at;
      updateTasks(client, (tasks) => [
        ...tasks.filter((t) => t.id !== vars.id),
        {
          ...vars,
          user_id: "",
          completed: false,
          completed_at: null,
          updated_at: now,
        },
      ]);
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTasks(client, snapshot),
  },
);

/**
 * Restores a deleted task exactly as it was (used by "Undo"). Replays as an
 * insert with the original id, so it is safe even if the delete never synced.
 */
export const restoreTaskMutation = defineMutation<Task, TaskSnapshot>(
  ["personal", "tasks", "restore"],
  {
    mutationFn: async (task) => {
      await api.insertTask({
        id: task.id,
        title: task.title,
        notes: task.notes,
        due_date: task.due_date,
        tag_ids: task.tag_ids,
        created_at: task.created_at,
      });
      if (task.completed) await api.updateTask({ id: task.id, patch: { completed: true } });
    },
    invalidates: taskQueries,
    optimistic: (client, task) => {
      const snapshot = snapshotTasks(client);
      updateTasks(client, (tasks) => [...tasks.filter((t) => t.id !== task.id), task]);
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTasks(client, snapshot),
  },
);

export const updateTaskMutation = defineMutation<UpdateTaskVars, TaskSnapshot>(
  ["personal", "tasks", "update"],
  {
    mutationFn: api.updateTask,
    invalidates: taskQueries,
    optimistic: (client, { id, patch }) => {
      const snapshot = snapshotTasks(client);
      const now = new Date().toISOString();
      updateTasks(client, (tasks) =>
        tasks.map((task) => {
          if (task.id !== id) return task;
          const next: Task = { ...task, ...patch, updated_at: now };
          if (patch.completed !== undefined) {
            next.completed_at = patch.completed ? now : null;
          }
          return next;
        }),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTasks(client, snapshot),
  },
);

export const deleteTaskMutation = defineMutation<{ id: string }, TaskSnapshot>(
  ["personal", "tasks", "delete"],
  {
    mutationFn: ({ id }) => api.deleteTask(id),
    invalidates: taskQueries,
    optimistic: (client, { id }) => {
      const snapshot = snapshotTasks(client);
      updateTasks(client, (tasks) => tasks.filter((t) => t.id !== id));
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTasks(client, snapshot),
  },
);

export const createTagMutation = defineMutation<CreateTagVars, TagSnapshot>(
  ["personal", "tags", "create"],
  {
    mutationFn: api.insertTag,
    invalidates: tagQueries,
    optimistic: (client, vars) => {
      const snapshot = snapshotTags(client);
      client.setQueryData<Tag[]>(personalKeys.tags(), (tags = []) =>
        [
          ...tags.filter((t) => t.id !== vars.id),
          { ...vars, user_id: "", updated_at: vars.created_at },
        ].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTags(client, snapshot),
  },
);

export const updateTagMutation = defineMutation<UpdateTagVars, TagSnapshot>(
  ["personal", "tags", "update"],
  {
    mutationFn: api.updateTag,
    invalidates: tagQueries,
    optimistic: (client, { id, patch }) => {
      const snapshot = snapshotTags(client);
      client.setQueryData<Tag[]>(personalKeys.tags(), (tags = []) =>
        tags
          .map((tag) => (tag.id === id ? { ...tag, ...patch } : tag))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTags(client, snapshot),
  },
);

export const deleteTagMutation = defineMutation<{ id: string }, TagSnapshot>(
  ["personal", "tags", "delete"],
  {
    mutationFn: ({ id }) => api.deleteTag(id),
    invalidates: tagQueries,
    optimistic: (client, { id }) => {
      const snapshot = snapshotTags(client);
      client.setQueryData<Tag[]>(personalKeys.tags(), (tags = []) =>
        tags.filter((tag) => tag.id !== id),
      );
      updateTasks(client, (tasks) =>
        tasks.map((task) =>
          task.tag_ids.includes(id)
            ? { ...task, tag_ids: task.tag_ids.filter((tagId) => tagId !== id) }
            : task,
        ),
      );
      return snapshot;
    },
    rollback: (client, snapshot) => restoreTags(client, snapshot),
  },
);

export const personalMutations = [
  createTaskMutation,
  restoreTaskMutation,
  updateTaskMutation,
  deleteTaskMutation,
  createTagMutation,
  updateTagMutation,
  deleteTagMutation,
];
