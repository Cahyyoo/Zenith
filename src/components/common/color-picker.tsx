"use client";

import { CheckIcon } from "lucide-react";

import { COLOR_CLASSES, TAG_COLORS, type TagColor } from "@/lib/domain";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
  value: TagColor;
  onChange: (color: TagColor) => void;
  id?: string;
};

export function ColorPicker({ value, onChange, id }: ColorPickerProps) {
  return (
    <div id={id} role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
      {TAG_COLORS.map((color) => {
        const selected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
              COLOR_CLASSES[color].dot,
              selected && "ring-2 ring-foreground/70",
            )}
          >
            {selected ? <CheckIcon className="size-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function ColorDot({ color, className }: { color: TagColor; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", COLOR_CLASSES[color].dot, className)}
    />
  );
}
