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

/** `/d` → Focus, the cross-project "what's next" list. */
export function DeveloperHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(routes.focus);
  }, [router]);

  return <Splash />;
}
