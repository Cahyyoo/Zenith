"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Splash } from "@/components/common/splash";
import { routes } from "@/lib/routes";

import { useSession } from "./session-provider";

/**
 * Client-side gate. Pages are static shells with no user data, so they can
 * be precached for offline use; data access itself is enforced by RLS.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(routes.login);
  }, [status, router]);

  if (status !== "authenticated") return <Splash />;
  return children;
}
