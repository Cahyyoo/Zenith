import { MutationCache, onlineManager, QueryClient, type Mutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { isNetworkError } from "@/lib/api-error";
import { personalMutations } from "@/features/personal/mutations";
import { developerMutations } from "@/features/developer/mutations";
import { settingsMutations } from "@/features/settings/mutations";

export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

export function makeQueryClient(): QueryClient {
  // onlineManager assumes "online" until an online/offline event fires, which
  // never happens when the app is (re)opened without a connection.
  if (typeof navigator !== "undefined") onlineManager.setOnline(navigator.onLine);

  const client = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error("Couldn't save your change", { description: error.message });
      },
    }),
    defaultOptions: {
      queries: {
        // Serve cached data immediately and never block on the network.
        networkMode: "offlineFirst",
        gcTime: CACHE_MAX_AGE,
        staleTime: 30_000,
        retry: (failureCount, error) => isNetworkError(error) && failureCount < 3,
      },
      mutations: {
        // Writes pause while offline and resume on reconnect.
        networkMode: "online",
      },
    },
  });

  for (const definition of [...personalMutations, ...developerMutations, ...settingsMutations]) {
    definition.register(client);
  }

  return client;
}

/**
 * Persist every unfinished write, not just paused ones: a write that was
 * mid-retry when the tab closed must survive the reload too.
 */
export function shouldPersistMutation(mutation: Mutation<unknown, Error, unknown, unknown>): boolean {
  return mutation.state.status === "pending";
}

/** Continue all restored writes (paused or interrupted) in their queued order. */
export async function resumeRestoredMutations(client: QueryClient): Promise<void> {
  const pending = client
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.status === "pending");
  await Promise.all(pending.map((mutation) => mutation.continue().catch(() => undefined)));
}
