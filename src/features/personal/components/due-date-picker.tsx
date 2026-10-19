"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDaysIso, formatDueDate, parseIsoDate, toIsoDate } from "@/lib/dates";

type DueDatePickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  id?: string;
};

const SHORTCUTS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
] as const;

export function DueDatePicker({ value, onChange, id }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);

  const pick = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" className="justify-start font-normal">
            <CalendarIcon className="text-muted-foreground" />
            {value ? formatDueDate(value) : <span className="text-muted-foreground">No due date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex gap-1 border-b p-2">
            {SHORTCUTS.map(({ label, days }) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => pick(addDaysIso(days))}
              >
                {label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="single"
            selected={value ? parseIsoDate(value) : undefined}
            onSelect={(date) => pick(date ? toIsoDate(date) : null)}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Clear due date"
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
