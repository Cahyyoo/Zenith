"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Splash } from "@/components/common/splash";
import { routes } from "@/lib/routes";
import { useWorkspaceHydrated, useWorkspaceStore } from "@/stores/workspace";

/** `/` → the workspace used last. */
export function HomeRedirect() {
  const router = useRouter();
  const hydrated = useWorkspaceHydrated();
  const lastWorkspace = useWorkspaceStore((state) => state.lastWorkspace);

  useEffect(() => {
    if (hydrated) router.replace(lastWorkspace === "developer" ? routes.developer : routes.personal);
  }, [hydrated, lastWorkspace, router]);

  return <Splash />;
}

/** `/d` → the board opened last, or the project list. */
export function DeveloperHomeRedirect() {
  const router = useRouter();
  const hydrated = useWorkspaceHydrated();
  const lastProjectId = useWorkspaceStore((state) => state.lastProjectId);

  useEffect(() => {
    if (hydrated) router.replace(lastProjectId ? routes.board(lastProjectId) : routes.projects);
  }, [hydrated, lastProjectId, router]);

  return <Splash />;
}
