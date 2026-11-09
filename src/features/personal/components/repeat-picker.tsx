"use client";

import { format, parseISO } from "date-fns";
import { RepeatIcon } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS } from "@/lib/work-schedule";

import { describeRecurrence, nextDueDate, type Recurrence } from "../lib/recurrence";

type PresetKey = "none" | "day1" | "day2" | "week1" | "week2" | "month1" | "year1" | "custom";

const PRESETS: { key: Exclude<PresetKey, "none" | "custom">; label: string; rule: (weekday: number) => Recurrence }[] = [
  { key: "day1", label: "Every day", rule: () => ({ freq: "day", interval: 1 }) },
  { key: "day2", label: "Every 2 days", rule: () => ({ freq: "day", interval: 2 }) },
  { key: "week1", label: "Every week", rule: (weekday) => ({ freq: "week", interval: 1, weekdays: [weekday] }) },
  { key: "week2", label: "Every 2 weeks", rule: (weekday) => ({ freq: "week", interval: 2, weekdays: [weekday] }) },
  { key: "month1", label: "Every month", rule: () => ({ freq: "month", interval: 1 }) },
  { key: "year1", label: "Every year", rule: () => ({ freq: "year", interval: 1 }) },
];

const UNITS: { value: Recurrence["freq"]; label: string }[] = [
  { value: "day", label: "day(s)" },
  { value: "week", label: "week(s)" },
  { value: "month", label: "month(s)" },
  { value: "year", label: "year(s)" },
];

function presetOf(rule: Recurrence | null): PresetKey {
  if (!rule) return "none";
  const singleWeekday = !rule.weekdays || rule.weekdays.length <= 1;
  if (rule.freq === "day" && rule.interval <= 2) return rule.interval === 1 ? "day1" : "day2";
  if (rule.freq === "week" && rule.interval <= 2 && singleWeekday) return rule.interval === 1 ? "week1" : "week2";
  if (rule.freq === "month" && rule.interval === 1) return "month1";
  if (rule.freq === "year" && rule.interval === 1) return "year1";
  return "custom";
}

type RepeatPickerProps = {
  id?: string;
  value: Recurrence | null;
  onChange: (rule: Recurrence | null) => void;
  /** The task's due date ("yyyy-MM-dd"), used for the weekday default and the "next" preview. */
  dueDate: string | null;
  today: string;
};

export function RepeatPicker({ id, value, onChange, dueDate, today }: RepeatPickerProps) {
  const [customOpen, setCustomOpen] = useState(() => presetOf(value) === "custom");
  const selected: PresetKey = customOpen ? "custom" : presetOf(value);
  const baseDate = parseISO(dueDate ?? today);
  const baseWeekday = (baseDate.getDay() + 6) % 7;

  const choose = (key: string) => {
    if (key === "none") {
      setCustomOpen(false);
      onChange(null);
      return;
    }
    if (key === "custom") {
      setCustomOpen(true);
      if (!value) onChange({ freq: "day", interval: 3 });
      return;
    }
    const preset = PRESETS.find((candidate) => candidate.key === key);
    if (preset) {
      setCustomOpen(false);
      onChange(preset.rule(baseWeekday));
    }
  };

  const toggleWeekday = (day: number) => {
    if (!value) return;
    const current = value.weekdays ?? [baseWeekday];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b);
    onChange({ ...value, weekdays: next.length > 0 ? next : current });
  };

  const preview = value ? nextDueDate(value, dueDate ?? today, dueDate ?? today) : null;

  return (
    <div className="flex flex-col gap-2">
      <Select value={selected} onValueChange={choose}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Does not repeat</SelectItem>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.key} value={preset.key}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom…</SelectItem>
        </SelectContent>
      </Select>

      {customOpen && value ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius)] border bg-muted/30 p-2.5 animate-in fade-in-0 slide-in-from-top-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Every</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={value.interval}
              onChange={(event) => {
                const interval = Math.min(365, Math.max(1, Number(event.target.value) || 1));
                onChange({ ...value, interval });
              }}
              aria-label="Repeat interval"
              className="h-8 w-20"
            />
            <Select
              value={value.freq}
              onValueChange={(freq) => {
                const unit = UNITS.find((candidate) => candidate.value === freq);
                if (!unit) return;
                onChange({
                  freq: unit.value,
                  interval: value.interval,
                  ...(unit.value === "week" ? { weekdays: value.weekdays ?? [baseWeekday] } : {}),
                });
              }}
            >
              <SelectTrigger className="h-8 w-32" aria-label="Repeat unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {value.freq === "week" ? (
            <div role="group" aria-label="Repeat on" className="flex flex-wrap gap-1">
              {WEEKDAY_LABELS.map((label, day) => {
                const on = (value.weekdays ?? [baseWeekday]).includes(day);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleWeekday(day)}
                    className={cn(
                      "h-8 min-w-10 rounded-full border px-2 text-xs font-medium transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {value && preview ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RepeatIcon className="size-3.5" />
          {describeRecurrence(value)} · next {format(parseISO(preview), "EEE d MMM")}
        </p>
      ) : null}
    </div>
  );
}
