"use client";

import { CloudCheckIcon, CloudOffIcon, RefreshCwIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SyncIndicatorProps = {
  online: boolean;
  pending: number;
  className?: string;
};

export function SyncIndicator({ online, pending, className }: SyncIndicatorProps) {
  const state = !online ? "offline" : pending > 0 ? "syncing" : "synced";
  const label = !online
    ? pending > 0
      ? `Offline · ${pending} pending`
      : "Offline"
    : pending > 0
      ? `Syncing ${pending}`
      : "Synced";

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      title={label}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className={cn(
        "flex items-center gap-1.5 overflow-hidden rounded-full px-2 py-1 text-xs font-medium transition-colors duration-300",
        state === "offline"
          ? "bg-highlight/15 text-highlight"
          : state === "syncing"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="flex"
        >
          {state === "offline" ? (
            <CloudOffIcon className="size-3.5" />
          ) : state === "syncing" ? (
            <RefreshCwIcon className="size-3.5 animate-spin" />
          ) : (
            <CloudCheckIcon className="size-3.5" />
          )}
        </motion.span>
      </AnimatePresence>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className={cn("whitespace-nowrap", state === "synced" && "sr-only sm:not-sr-only")}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
