import { z } from "zod";

import { tagColorSchema } from "@/lib/domain";

import { recurrenceSchema } from "./lib/recurrence";

const isoDate = z.iso.date();
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

// Plain object (no refinements) so it can be extended and made partial below.
const taskFields = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(200),
  notes: z.string().max(5000),
  due_date: isoDate.nullable(),
  /** Optional time on the due date, local "HH:mm". */
  due_time: hhmm.nullable(),
  recurrence: recurrenceSchema.nullable(),
  /** Minutes before the due time to remind; null = no reminder, 0 = at the time. */
  remind_offset_minutes: z.number().int().min(0).max(10080).nullable(),
  tag_ids: z.array(z.uuid()),
});

export const taskFormSchema = taskFields.superRefine((values, ctx) => {
  if (values.recurrence && !values.due_date) {
    ctx.addIssue({ code: "custom", path: ["due_date"], message: "Repeating tasks need a due date" });
  }
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

const remindAt = z.iso.datetime({ offset: true }).nullable();

export const createTaskSchema = taskFields.extend({
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
  /** Computed on the device from date + time − offset (its own timezone). */
  remind_at: remindAt,
});
export type CreateTaskVars = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.uuid(),
  patch: taskFields.partial().extend({
    remind_at: remindAt.optional(),
    completed: z.boolean().optional(),
    /** "Sedang dikerjakan": time is tracked while doing and not completed. */
    doing: z.boolean().optional(),
    /** Device time of a status change; the server records time entries from it. */
    status_changed_at: z.iso.datetime({ offset: true }).optional(),
  }),
});
export type UpdateTaskVars = z.infer<typeof updateTaskSchema>;

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, "Name the tag").max(40),
  color: tagColorSchema,
});
export type TagFormValues = z.infer<typeof tagFormSchema>;

export const createTagSchema = tagFormSchema.extend({
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
});
export type CreateTagVars = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  id: z.uuid(),
  patch: tagFormSchema.partial(),
});
export type UpdateTagVars = z.infer<typeof updateTagSchema>;
