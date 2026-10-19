"use client";

import { create } from "zustand";

type UiState = {
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
};

/** Ephemeral global UI state shared by the FAB, header buttons and shortcuts. */
export const useUiStore = create<UiState>()((set) => ({
  quickAddOpen: false,
  setQuickAddOpen: (quickAddOpen) => set({ quickAddOpen }),
}));
