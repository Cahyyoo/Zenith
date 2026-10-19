"use client";

import { Code2Icon, LeafIcon } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

import type { Workspace } from "@/lib/domain";
import { spring } from "@/lib/motion";
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
  // Several switchers can be mounted at once (header + sidebar), so each
  // needs its own shared-layout id for the sliding pill.
  const pillId = useId();

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
              "relative flex items-center justify-center gap-1.5 rounded-[calc(var(--radius)-0.25rem)] px-2.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={pillId}
                transition={spring.snappy}
                className="absolute inset-0 rounded-[inherit] bg-background shadow-sm"
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              <Icon className={cn("size-3.5 transition-colors", active && "text-primary")} />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
