"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useDefinedMutation } from "@/lib/query/define-mutation";

import { fetchTags, fetchTasks } from "./api";
import { personalKeys } from "./keys";
import {
  createTagMutation,
  createTaskMutation,
  deleteTagMutation,
  deleteTaskMutation,
  restoreTaskMutation,
  updateTagMutation,
  updateTaskMutation,
} from "./mutations";
import type { TagFormValues, TaskFormValues } from "./schemas";
import type { Tag, Task } from "./types";

export function useTasks() {
  return useQuery({ queryKey: personalKeys.tasks(), queryFn: fetchTasks });
}

export function useTags() {
  return useQuery({ queryKey: personalKeys.tags(), queryFn: fetchTags });
}

export function useTagMap(): Map<string, Tag> {
  const { data } = useTags();
  return useMemo(() => new Map((data ?? []).map((tag) => [tag.id, tag])), [data]);
}

export function useTaskActions() {
  const { mutate: create } = useDefinedMutation(createTaskMutation);
  const { mutate: update } = useDefinedMutation(updateTaskMutation);
  const { mutate: remove } = useDefinedMutation(deleteTaskMutation);
  const { mutate: restore } = useDefinedMutation(restoreTaskMutation);

  return {
    createTask: useCallback(
      (values: TaskFormValues) =>
        create({ ...values, id: crypto.randomUUID(), created_at: new Date().toISOString() }),
      [create],
    ),
    updateTask: useCallback(
      (id: string, patch: Partial<TaskFormValues>) => update({ id, patch }),
      [update],
    ),
    setCompleted: useCallback(
      (id: string, completed: boolean) => update({ id, patch: { completed } }),
      [update],
    ),
    deleteTask: useCallback((task: Task) => remove({ id: task.id }), [remove]),
    restoreTask: useCallback((task: Task) => restore(task), [restore]),
  };
}

export function useTagActions() {
  const { mutate: create } = useDefinedMutation(createTagMutation);
  const { mutate: update } = useDefinedMutation(updateTagMutation);
  const { mutate: remove } = useDefinedMutation(deleteTagMutation);

  return {
    createTag: useCallback(
      (values: TagFormValues) =>
        create({ ...values, id: crypto.randomUUID(), created_at: new Date().toISOString() }),
      [create],
    ),
    updateTag: useCallback(
      (id: string, patch: Partial<TagFormValues>) => update({ id, patch }),
      [update],
    ),
    deleteTag: useCallback((id: string) => remove({ id }), [remove]),
  };
}
