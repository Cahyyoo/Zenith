"use client";

import { onlineManager, useMutationState } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { SYNC_SCOPE } from "./define-mutation";

export type SyncStatus = {
  online: boolean;
  /** Writes made locally that have not reached Supabase yet. */
  pending: number;
};

function useOnline(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
    () => true,
  );
}

export function useSyncStatus(): SyncStatus {
  const online = useOnline();
  const statuses = useMutationState({
    filters: { predicate: (m) => m.options.scope?.id === SYNC_SCOPE.id },
    select: (m) => m.state.status,
  });

  return {
    online,
    pending: statuses.filter((s) => s === "pending").length,
  };
}
