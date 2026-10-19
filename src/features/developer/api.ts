import { check, isReplayedInsert, unwrap } from "@/lib/api-error";
import { getSupabase } from "@/lib/supabase/client";

import type {
  CreateIssueVars,
  CreateProjectVars,
  RebalanceColumnVars,
  UpdateIssueVars,
  UpdateProjectVars,
} from "./schemas";
import { rebalancedPositions } from "./lib/position";
import type { Issue, Project } from "./types";

export async function fetchProjects(): Promise<Project[]> {
  return unwrap(
    await getSupabase().from("projects").select("*").order("created_at", { ascending: true }),
  );
}

export async function insertProject(project: CreateProjectVars): Promise<void> {
  try {
    check(await getSupabase().from("projects").insert(project));
  } catch (error) {
    if (!isReplayedInsert(error, "projects")) throw error;
  }
}

export async function updateProject({ id, patch }: UpdateProjectVars): Promise<void> {
  check(await getSupabase().from("projects").update(patch).eq("id", id));
}

export async function deleteProject(id: string): Promise<void> {
  check(await getSupabase().from("projects").delete().eq("id", id));
}

export async function fetchIssues(projectId: string): Promise<Issue[]> {
  return unwrap(
    await getSupabase()
      .from("issues")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
  );
}

export async function insertIssue(issue: CreateIssueVars): Promise<void> {
  try {
    check(await getSupabase().from("issues").insert(issue));
  } catch (error) {
    if (!isReplayedInsert(error, "issues")) throw error;
  }
}

export async function updateIssue({ id, patch }: UpdateIssueVars): Promise<void> {
  check(await getSupabase().from("issues").update(patch).eq("id", id));
}

export async function deleteIssue(id: string): Promise<void> {
  check(await getSupabase().from("issues").delete().eq("id", id));
}

export async function rebalanceColumn({ status, ordered_ids }: RebalanceColumnVars): Promise<void> {
  const positions = rebalancedPositions(ordered_ids.length);
  const supabase = getSupabase();
  const results = await Promise.all(
    ordered_ids.map((id, index) =>
      supabase.from("issues").update({ status, position: positions[index] }).eq("id", id),
    ),
  );
  for (const result of results) check(result);
}
