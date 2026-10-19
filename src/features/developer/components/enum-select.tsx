"use client";

import type { ReactNode } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EnumSelectProps<T extends string> = {
  id?: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  renderIcon?: (value: T) => ReactNode;
  onChange: (value: T) => void;
  ariaLabel?: string;
};

/** Typed select over a fixed set of enum values. */
export function EnumSelect<T extends string>({
  id,
  value,
  options,
  labels,
  renderIcon,
  onChange,
  ariaLabel,
}: EnumSelectProps<T>) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const match = options.find((option) => option === next);
        if (match) onChange(match);
      }}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {renderIcon ? renderIcon(option) : null}
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
