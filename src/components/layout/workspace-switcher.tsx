"use client";

import { Code2Icon, LeafIcon } from "lucide-react";

import type { Workspace } from "@/lib/domain";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Workspace; label: string; icon: typeof LeafIcon }[] = [
  { value: "personal", label: "Personal", icon: LeafIcon },
  { value: "developer", label: "Developer", icon: Code2Icon },
];

type WorkspaceSwitcherProps = {
  value: Workspace;
  onChange: (workspace: Workspace) => void;
  className?: string;
};

export function WorkspaceSwitcher({ value, onChange, className }: WorkspaceSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Workspace"
      className={cn("grid grid-cols-2 gap-1 rounded-[var(--radius)] bg-muted p-1", className)}
    >
      {OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[calc(var(--radius)-0.25rem)] px-2.5 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("size-3.5", active && "text-primary")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
