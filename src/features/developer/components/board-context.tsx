"use client";

import { createContext, useContext } from "react";

import type { IssueStatus } from "@/lib/domain";
import type { WorkSchedule } from "@/lib/work-schedule";

type BoardContextValue = {
  projectKey: string;
  onOpenIssue: (id: string) => void;
  onAddIssue: (status: IssueStatus) => void;
  /** Working hours for live timers on cards. */
  schedule: WorkSchedule;
};

/** Shared board callbacks, so columns and cards don't need prop drilling. */
export const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) throw new Error("useBoard must be used within <BoardContext>");
  return context;
}
