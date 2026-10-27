"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS, workDaySchema, type WorkDay, type WorkSchedule } from "@/lib/work-schedule";

type WorkScheduleEditorProps = {
  value: WorkSchedule;
  onChange: (schedule: WorkSchedule) => void;
};

/** One row per weekday: on/off plus start and end time. */
export function WorkScheduleEditor({ value, onChange }: WorkScheduleEditorProps) {
  const update = (index: number, patch: Partial<WorkDay>) =>
    onChange(value.map((day, i) => (i === index ? { ...day, ...patch } : day)));

  return (
    <ul className="flex flex-col divide-y rounded-[var(--radius)] border">
      {value.map((day, index) => {
        const label = WEEKDAY_LABELS[index] ?? "";
        const invalid = !workDaySchema.safeParse(day).success;
        return (
          <li key={label} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
            <label className="flex w-20 items-center gap-2 text-sm font-medium">
              <Switch
                checked={day.enabled}
                onCheckedChange={(enabled) => update(index, { enabled })}
                aria-label={`Work on ${label}`}
              />
              {label}
            </label>
            <div
              className={cn("flex items-center gap-1.5 transition-opacity", !day.enabled && "pointer-events-none opacity-40")}
              aria-disabled={!day.enabled}
            >
              <Input
                type="time"
                value={day.start}
                onChange={(event) => update(index, { start: event.target.value })}
                aria-label={`${label} start`}
                aria-invalid={invalid || undefined}
                disabled={!day.enabled}
                className="h-8 w-[8.5rem] tabular-nums"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                value={day.end}
                onChange={(event) => update(index, { end: event.target.value })}
                aria-label={`${label} end`}
                aria-invalid={invalid || undefined}
                disabled={!day.enabled}
                className="h-8 w-[8.5rem] tabular-nums"
              />
            </div>
            {invalid ? <span className="text-xs text-destructive">End must be after start</span> : null}
            {!day.enabled ? <span className="text-xs text-muted-foreground">Day off</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
