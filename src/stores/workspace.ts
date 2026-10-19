"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Workspace } from "@/lib/domain";
import { WORKSPACE_STORAGE_KEY } from "@/lib/storage-keys";

type WorkspaceState = {
  lastWorkspace: Workspace;
  lastProjectId: string | null;
  sidebarOpen: boolean;
  setLastWorkspace: (workspace: Workspace) => void;
  setLastProjectId: (projectId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
};

/** Persisted UI preferences (localStorage). Never holds server data. */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      lastWorkspace: "personal",
      lastProjectId: null,
      sidebarOpen: true,
      setLastWorkspace: (lastWorkspace) => set({ lastWorkspace }),
      setLastProjectId: (lastProjectId) => set({ lastProjectId }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated from <Providers> after mount so the prerendered shell and
      // the first client render agree.
      skipHydration: true,
      partialize: ({ lastWorkspace, lastProjectId, sidebarOpen }) => ({
        lastWorkspace,
        lastProjectId,
        sidebarOpen,
      }),
    },
  ),
);

export function useWorkspaceHydrated(): boolean {
  return useSyncExternalStore(
    (callback) => useWorkspaceStore.persist.onFinishHydration(callback),
    () => useWorkspaceStore.persist.hasHydrated(),
    () => false,
  );
}
