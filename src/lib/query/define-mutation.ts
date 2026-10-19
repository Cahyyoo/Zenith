import {
  useMutation,
  type MutationFunctionContext,
  type MutationKey,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import { isNetworkError } from "@/lib/api-error";

/**
 * All writes share one scope so they replay strictly in the order they were
 * made (e.g. "create task" always reaches the server before "complete task").
 */
export const SYNC_SCOPE = { id: "zenith-sync" } as const;

type DefinitionOptions<TVars, TCtx> = {
  mutationFn: (variables: TVars) => Promise<unknown>;
  /** Apply the optimistic change; the returned value is handed to `rollback`. */
  optimistic?: (client: QueryClient, variables: TVars) => TCtx | Promise<TCtx>;
  rollback?: (client: QueryClient, context: TCtx, variables: TVars) => void;
  /** Query keys refetched once the sync queue for this domain is drained. */
  invalidates: (variables: TVars) => QueryKey[];
};

export type MutationDefinition<TVars> = {
  mutationKey: MutationKey;
  register: (client: QueryClient) => void;
  /** Phantom marker so `useDefinedMutation` can infer the variables type. */
  readonly __vars?: TVars;
};

/**
 * Declares a mutation whose behaviour lives in `setMutationDefaults`, not in
 * the component. That is what lets a mutation persisted to IndexedDB while
 * offline be resumed after a full reload — the restored mutation only carries
 * its key and variables, and looks up its function here.
 */
export function defineMutation<TVars, TCtx = undefined>(
  mutationKey: MutationKey,
  options: DefinitionOptions<TVars, TCtx>,
): MutationDefinition<TVars> {
  const register = (client: QueryClient) => {
    client.setMutationDefaults<unknown, Error, TVars, TCtx | undefined>(mutationKey, {
      scope: SYNC_SCOPE,
      // A queued write is never dropped for connectivity reasons: network
      // failures retry with capped backoff until the server is reachable.
      retry: (_failureCount, error) => isNetworkError(error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      mutationFn: (variables) => options.mutationFn(variables),
      onMutate: async (variables, ctx: MutationFunctionContext) => {
        if (!options.optimistic) return undefined;
        await Promise.all(
          options.invalidates(variables).map((queryKey) => ctx.client.cancelQueries({ queryKey })),
        );
        return options.optimistic(ctx.client, variables);
      },
      onError: (_error, variables, context, ctx) => {
        if (context !== undefined && options.rollback) {
          options.rollback(ctx.client, context, variables);
        }
      },
      onSettled: (_data, _error, variables, _context, ctx) => {
        // Refetch only when this is the last pending write, so a later
        // optimistic change is not overwritten by a stale server snapshot.
        if (ctx.client.isMutating({ predicate: (m) => m.options.scope?.id === SYNC_SCOPE.id }) > 1) {
          return;
        }
        return Promise.all(
          options.invalidates(variables).map((queryKey) => ctx.client.invalidateQueries({ queryKey })),
        );
      },
    });
  };

  return { mutationKey, register };
}

export function useDefinedMutation<TVars>(definition: MutationDefinition<TVars>) {
  return useMutation<unknown, Error, TVars>({ mutationKey: definition.mutationKey });
}
