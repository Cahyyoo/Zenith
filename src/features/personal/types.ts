import type { Tables } from "@/types/database";

import type { Recurrence } from "./lib/recurrence";

export type Tag = Tables<"tags">;

/**
 * A personal task with its tag ids flattened from the join table and its
 * repeat rule parsed (`due_time` is "HH:mm").
 */
export type Task = Omit<Tables<"personal_tasks">, "recurrence"> & {
  recurrence: Recurrence | null;
  tag_ids: string[];
};
