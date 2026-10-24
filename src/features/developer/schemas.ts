import { z } from "zod";

import {
  issuePrioritySchema,
  issueStatusSchema,
  issueTypeSchema,
  tagColorSchema,
} from "@/lib/domain";

export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Name the project").max(80),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PROJECT_KEY_PATTERN, "2–10 characters, letters and digits, starting with a letter"),
  description: z.string().max(2000),
  color: tagColorSchema,
  /** Feeds the Focus ranking: issues of important / soon-due projects rank higher. */
  priority: issuePrioritySchema,
  target_date: z.iso.date().nullable(),
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const createProjectSchema = projectFormSchema.extend({
  id: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
});
export type CreateProjectVars = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: z.uuid(),
  patch: projectFormSchema.partial().extend({ archived: z.boolean().optional() }),
});
export type UpdateProjectVars = z.infer<typeof updateProjectSchema>;

export const issueFormSchema = z.object({
  project_id: z.uuid("Pick a project"),
  title: z.string().trim().min(1, "Give the issue a title").max(200),
  description_md: z.string().max(50000),
  type: issueTypeSchema,
  priority: issuePrioritySchema,
  status: issueStatusSchema,
});
export type IssueFormValues = z.infer<typeof issueFormSchema>;

export const createIssueSchema = issueFormSchema.extend({
  id: z.uuid(),
  position: z.number(),
  created_at: z.iso.datetime({ offset: true }),
  status_changed_at: z.iso.datetime({ offset: true }).nullable(),
});
export type CreateIssueVars = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  patch: issueFormSchema.omit({ project_id: true }).partial().extend({
    position: z.number().optional(),
    /** Device time of a status change; the server records time entries from it. */
    status_changed_at: z.iso.datetime({ offset: true }).optional(),
  }),
});
export type UpdateIssueVars = z.infer<typeof updateIssueSchema>;

export const rebalanceColumnSchema = z.object({
  project_id: z.uuid(),
  status: issueStatusSchema,
  ordered_ids: z.array(z.uuid()),
});
export type RebalanceColumnVars = z.infer<typeof rebalanceColumnSchema>;

/** Suggests a project key from its name: "Zenith Mobile App" → "ZMA", "Zenith" → "ZEN". */
export function suggestProjectKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0];
  if (!first) return "";
  const raw =
    words.length > 1 ? words.map((w) => w[0]).join("") : first.slice(0, 3);
  const key = raw.replace(/^[0-9]+/, "").slice(0, 10);
  return key.length >= 2 ? key : (key + first.slice(1, 3)).slice(0, 10);
}
