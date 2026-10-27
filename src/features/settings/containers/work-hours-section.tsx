"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { hoursPerWeek, SCHEDULE_PRESETS, workScheduleSchema, type WorkSchedule } from "@/lib/work-schedule";

import { WorkScheduleEditor } from "../components/work-schedule-editor";
import { useSaveSchedule, useWorkSchedule } from "../hooks";

/** Editable working hours; remounted (via key) whenever the saved schedule changes. */
function WorkHoursForm({ saved }: { saved: WorkSchedule }) {
  const save = useSaveSchedule();
  const [draft, setDraft] = useState<WorkSchedule>(saved);

  const valid = workScheduleSchema.safeParse(draft).success;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const hours = Math.round(hoursPerWeek(draft) * 10) / 10;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SCHEDULE_PRESETS.map((preset) => (
          <Button key={preset.label} type="button" size="sm" variant="outline" onClick={() => setDraft(preset.schedule)}>
            {preset.label}
          </Button>
        ))}
      </div>
      <WorkScheduleEditor value={draft} onChange={setDraft} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">{hours} hours / week</span>
        <div className="flex gap-2">
          {dirty ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(saved)}>
              Reset
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={!dirty || !valid}
            onClick={() => {
              save(draft);
              toast.success("Working hours saved", { description: "Reports now count time within these hours." });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WorkHoursSection() {
  const saved = useWorkSchedule();
  return <WorkHoursForm key={JSON.stringify(saved)} saved={saved} />;
}
