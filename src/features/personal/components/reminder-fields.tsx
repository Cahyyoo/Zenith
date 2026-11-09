"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TimeFieldProps = {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/** Optional time of day ("HH:mm") with a clear button. */
export function TimeField({ id, value, onChange, disabled }: TimeFieldProps) {
  return (
    <div className="flex items-center gap-1">
      <Input
        id={id}
        type="time"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-8 w-[8.5rem] tabular-nums"
      />
      {value ? (
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Clear time" onClick={() => onChange(null)}>
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

const REMINDERS: { value: string; label: string }[] = [
  { value: "none", label: "No reminder" },
  { value: "0", label: "At the time" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
];

type ReminderPickerProps = {
  id?: string;
  value: number | null;
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
};

/** Minutes before the due time to send a notification. */
export function ReminderPicker({ id, value, onChange, disabled }: ReminderPickerProps) {
  const known = REMINDERS.some((option) => option.value === String(value));
  return (
    <Select
      value={value === null ? "none" : String(value)}
      onValueChange={(next) => onChange(next === "none" ? null : Number(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {REMINDERS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {!known && value !== null ? <SelectItem value={String(value)}>{value} minutes before</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
