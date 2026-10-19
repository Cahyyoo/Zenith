import type { Tables } from "@/types/database";

export type Tag = Tables<"tags">;

/** A personal task with its tag ids flattened from the join table. */
export type Task = Tables<"personal_tasks"> & { tag_ids: string[] };
