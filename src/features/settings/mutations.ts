import { defineMutation } from "@/lib/query/define-mutation";
import type { WorkSchedule } from "@/lib/work-schedule";

import { timeKeys } from "@/features/time/keys";

import { saveWorkSchedule, type UserSettings } from "./api";
import { settingsKeys } from "./keys";

type SettingsSnapshot = { settings: UserSettings | undefined };

export const saveScheduleMutation = defineMutation<{ schedule: WorkSchedule }, SettingsSnapshot>(
  ["settings", "schedule", "save"],
  {
    mutationFn: ({ schedule }) => saveWorkSchedule(schedule),
    invalidates: () => [settingsKeys.all, timeKeys.all],
    optimistic: (client, { schedule }) => {
      const snapshot = { settings: client.getQueryData<UserSettings>(settingsKeys.all) };
      client.setQueryData<UserSettings>(settingsKeys.all, { workSchedule: schedule });
      return snapshot;
    },
    rollback: (client, snapshot) => client.setQueryData(settingsKeys.all, snapshot.settings),
  },
);

export const settingsMutations = [saveScheduleMutation];
