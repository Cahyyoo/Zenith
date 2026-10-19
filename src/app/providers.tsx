"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/features/auth/session-provider";
import { CACHE_BUSTER, queryPersister } from "@/lib/query/persister";
import {
  CACHE_MAX_AGE,
  makeQueryClient,
  resumeRestoredMutations,
  shouldPersistMutation,
} from "@/lib/query/query-client";
import { useWorkspaceStore } from "@/stores/workspace";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => {
    void useWorkspaceStore.persist.rehydrate();
  }, []);

  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV === "development"}
      reloadOnOnline={false}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: CACHE_MAX_AGE,
            buster: CACHE_BUSTER,
            dehydrateOptions: { shouldDehydrateMutation: shouldPersistMutation },
          }}
          onSuccess={() => {
            // Replay writes queued in a previous session, then refresh from the
            // server. Not awaited: the provider keeps queries in their restoring
            // state until this returns, and offline the replay waits for a
            // connection — cached data must render immediately.
            void resumeRestoredMutations(queryClient).then(() => queryClient.invalidateQueries());
          }}
        >
          <SessionProvider>
            <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          </SessionProvider>
          <Toaster position="top-center" richColors closeButton />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </SerwistProvider>
  );
}
