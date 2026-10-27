"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useDefinedMutation } from "@/lib/query/define-mutation";
import { DEFAULT_SCHEDULE, type WorkSchedule } from "@/lib/work-schedule";

import { fetchSettings } from "./api";
import { settingsKeys } from "./keys";
import { saveScheduleMutation } from "./mutations";

export function useSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: fetchSettings });
}

/** Working hours for counting time; the default until settings load. */
export function useWorkSchedule(): WorkSchedule {
  return useSettings().data?.workSchedule ?? DEFAULT_SCHEDULE;
}

export function useSaveSchedule() {
  const { mutate } = useDefinedMutation(saveScheduleMutation);
  return useCallback((schedule: WorkSchedule) => mutate({ schedule }), [mutate]);
}
