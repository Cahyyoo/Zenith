"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { todayIso } from "@/lib/dates";
import { useDefinedMutation } from "@/lib/query/define-mutation";

import { fetchTags, fetchTasks, normalizeTasks } from "./api";
import { computeRemindAt, nextDueDate, type Recurrence } from "./lib/recurrence";
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
  return useQuery({ queryKey: personalKeys.tasks(), queryFn: fetchTasks, select: normalizeTasks });
}

/** Monthly rules remember their day of month so short months don't shift them. */
function anchored(rule: Recurrence | null, dueDate: string | null): Recurrence | null {
  if (!rule || rule.freq !== "month" || rule.anchorDay || !dueDate) return rule;
  return { ...rule, anchorDay: Number(dueDate.slice(8, 10)) };
}

/** Form values plus the device-computed reminder time. */
function withReminder(values: TaskFormValues) {
  const recurrence = anchored(values.recurrence, values.due_date);
  return {
    ...values,
    recurrence,
    remind_at: computeRemindAt(values.due_date, values.due_time, values.remind_offset_minutes),
  };
}

export type CompletionResult = {
  /** Due date of the next occurrence created for a repeating task. */
  nextDue: string;
  undo: () => void;
};

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
        create({ ...withReminder(values), id: crypto.randomUUID(), created_at: new Date().toISOString() }),
      [create],
    ),
    updateTask: useCallback(
      (id: string, values: TaskFormValues) => update({ id, patch: withReminder(values) }),
      [update],
    ),
    /**
     * Completing also ends any running "Sedang dikerjakan" session. For a
     * repeating task it creates the next occurrence and moves the repeat
     * rule onto it, so reopening the finished one never duplicates it.
     */
    setCompleted: useCallback(
      (task: Task, completed: boolean): CompletionResult | null => {
        const changedAt = new Date().toISOString();
        if (!completed) {
          update({ id: task.id, patch: { completed, status_changed_at: changedAt } });
          return null;
        }
        const rule = task.recurrence;
        if (!rule || !task.due_date) {
          update({ id: task.id, patch: { completed, doing: false, status_changed_at: changedAt } });
          return null;
        }

        const nextDue = nextDueDate(rule, task.due_date, todayIso());
        const nextId = crypto.randomUUID();
        create({
          id: nextId,
          created_at: changedAt,
          title: task.title,
          notes: task.notes,
          tag_ids: task.tag_ids,
          due_date: nextDue,
          due_time: task.due_time,
          recurrence: rule,
          remind_offset_minutes: task.remind_offset_minutes,
          remind_at: computeRemindAt(nextDue, task.due_time, task.remind_offset_minutes),
        });
        update({
          id: task.id,
          patch: { completed: true, doing: false, recurrence: null, status_changed_at: changedAt },
        });
        return {
          nextDue,
          undo: () => {
            remove({ id: nextId });
            update({
              id: task.id,
              patch: { completed: false, recurrence: rule, status_changed_at: new Date().toISOString() },
            });
          },
        };
      },
      [create, update, remove],
    ),
    /** "Skip this time": move a repeating task to its next occurrence without completing it. */
    skipTask: useCallback(
      (task: Task): string | null => {
        if (!task.recurrence || !task.due_date) return null;
        const nextDue = nextDueDate(task.recurrence, task.due_date, todayIso());
        update({
          id: task.id,
          patch: {
            due_date: nextDue,
            remind_at: computeRemindAt(nextDue, task.due_time, task.remind_offset_minutes),
          },
        });
        return nextDue;
      },
      [update],
    ),
    /** "Mulai": the task becomes "Sedang dikerjakan" and its time starts. */
    startTask: useCallback(
      (id: string) => update({ id, patch: { doing: true, status_changed_at: new Date().toISOString() } }),
      [update],
    ),
    /** "Jeda": stops the running time; the task stays open. */
    pauseTask: useCallback(
      (id: string) => update({ id, patch: { doing: false, status_changed_at: new Date().toISOString() } }),
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
