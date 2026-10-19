"use client";

import { usePathname } from "next/navigation";

import type { Workspace } from "@/lib/domain";
import { useWorkspaceStore } from "@/stores/workspace";

export function workspaceFromPath(pathname: string): Workspace | null {
  if (pathname === "/d" || pathname.startsWith("/d/")) return "developer";
  if (pathname === "/p" || pathname.startsWith("/p/")) return "personal";
  return null;
}

/** The active workspace: taken from the route, falling back to the last one used. */
export function useWorkspace(): Workspace {
  const pathname = usePathname();
  const lastWorkspace = useWorkspaceStore((state) => state.lastWorkspace);
  return workspaceFromPath(pathname) ?? lastWorkspace;
}

export const WORKSPACE_HOME: Record<Workspace, string> = {
  personal: "/p",
  developer: "/d",
};
