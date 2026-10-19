import { check, isReplayedInsert, unwrap } from "@/lib/api-error";
import { getSupabase } from "@/lib/supabase/client";

import type {
  CreateTagVars,
  CreateTaskVars,
  UpdateTagVars,
  UpdateTaskVars,
} from "./schemas";
import type { Tag, Task } from "./types";

// Pure async functions over Supabase. Every write is idempotent so a
// replayed offline mutation that already reached the server is harmless.

export async function fetchTasks(): Promise<Task[]> {
  const rows = unwrap(
    await getSupabase()
      .from("personal_tasks")
      .select("*, personal_task_tags(tag_id)")
      .order("created_at", { ascending: true }),
  );
  return rows.map(({ personal_task_tags, ...task }) => ({
    ...task,
    tag_ids: personal_task_tags.map((link) => link.tag_id),
  }));
}

async function setTaskTags(taskId: string, tagIds: string[]): Promise<void> {
  check(await getSupabase().rpc("set_task_tags", { p_task_id: taskId, p_tag_ids: tagIds }));
}

export async function insertTask({ tag_ids, ...task }: CreateTaskVars): Promise<void> {
  try {
    check(await getSupabase().from("personal_tasks").insert(task));
  } catch (error) {
    if (!isReplayedInsert(error, "personal_tasks")) throw error;
  }
  if (tag_ids.length > 0) await setTaskTags(task.id, tag_ids);
}

export async function updateTask({ id, patch }: UpdateTaskVars): Promise<void> {
  const { tag_ids, ...columns } = patch;
  if (Object.keys(columns).length > 0) {
    check(await getSupabase().from("personal_tasks").update(columns).eq("id", id));
  }
  if (tag_ids) await setTaskTags(id, tag_ids);
}

export async function deleteTask(id: string): Promise<void> {
  check(await getSupabase().from("personal_tasks").delete().eq("id", id));
}

export async function fetchTags(): Promise<Tag[]> {
  return unwrap(
    await getSupabase().from("tags").select("*").order("name", { ascending: true }),
  );
}

export async function insertTag(tag: CreateTagVars): Promise<void> {
  try {
    check(await getSupabase().from("tags").insert(tag));
  } catch (error) {
    if (!isReplayedInsert(error, "tags")) throw error;
  }
}

export async function updateTag({ id, patch }: UpdateTagVars): Promise<void> {
  check(await getSupabase().from("tags").update(patch).eq("id", id));
}

export async function deleteTag(id: string): Promise<void> {
  check(await getSupabase().from("tags").delete().eq("id", id));
}
