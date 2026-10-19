"use client";

import { CheckIcon } from "lucide-react";

import { COLOR_CLASSES } from "@/lib/domain";
import { cn } from "@/lib/utils";

import type { Tag } from "../types";

type TagPickerProps = {
  tags: Tag[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function TagPicker({ tags, value, onChange }: TagPickerProps) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">No tags yet. Create some under Tags.</p>;
  }

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((tagId) => tagId !== id) : [...value, id]);

  return (
    <div role="group" aria-label="Tags" className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(tag.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? cn(COLOR_CLASSES[tag.color].soft, "border-transparent") : "text-muted-foreground hover:bg-muted",
            )}
          >
            {selected ? (
              <CheckIcon className="size-3" />
            ) : (
              <span className={cn("size-2 rounded-full", COLOR_CLASSES[tag.color].dot)} />
            )}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
