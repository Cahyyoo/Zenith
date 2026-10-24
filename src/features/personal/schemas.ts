import { z } from "zod";

import { tagColorSchema } from "@/lib/domain";

const isoDate = z.iso.date();

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(200),
  notes: z.string().max(5000),
  due_date: isoDate.nullable(),
  tag_ids: z.array(z.uuid()),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const createTaskSchema = taskFormSchema.extend({
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
});
export type CreateTaskVars = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.uuid(),
  patch: taskFormSchema.partial().extend({
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
