import { unwrap } from "@/lib/api-error";
import { getSupabase } from "@/lib/supabase/client";

import type { EntryKind } from "./keys";
import type { Session } from "./lib/time";

const COLUMNS =
  "id, task_id, issue_id, started_at, ended_at, issue:issues(id, title, number, type, project_id), task:personal_tasks(id, title)";

async function queryEntries(kind: EntryKind, filter: { from: string; to: string } | { itemId: string }) {
  let query = getSupabase().from("time_entries").select(COLUMNS);
  query = kind === "task" ? query.not("task_id", "is", null) : query.not("issue_id", "is", null);
  if ("itemId" in filter) {
    query = query.eq(kind === "task" ? "task_id" : "issue_id", filter.itemId);
  } else {
    // Any session overlapping [from, to): started before `to` and not ended before `from`.
    query = query.lt("started_at", filter.to).or(`ended_at.is.null,ended_at.gte."${filter.from}"`);
  }
  return unwrap(await query.order("started_at", { ascending: true }));
}

export type EntryRow = Awaited<ReturnType<typeof queryEntries>>[number];

export function fetchEntries(kind: EntryKind, from: string, to: string) {
  return queryEntries(kind, { from, to });
}

export function fetchItemEntries(kind: EntryKind, itemId: string) {
  return queryEntries(kind, { itemId });
}

export function toSession(row: EntryRow): Session {
  return {
    id: row.id,
    itemId: row.issue_id ?? row.task_id ?? "",
    start: Date.parse(row.started_at),
    end: row.ended_at ? Date.parse(row.ended_at) : null,
  };
}
