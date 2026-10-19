import { CloudCheckIcon, CloudOffIcon, RefreshCwIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SyncIndicatorProps = {
  online: boolean;
  pending: number;
  className?: string;
};

export function SyncIndicator({ online, pending, className }: SyncIndicatorProps) {
  const label = !online
    ? pending > 0
      ? `Offline · ${pending} pending`
      : "Offline"
    : pending > 0
      ? `Syncing ${pending}`
      : "Synced";

  return (
    <div
      role="status"
      aria-live="polite"
      title={label}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
        !online
          ? "bg-highlight/15 text-highlight"
          : pending > 0
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground",
        className,
      )}
    >
      {!online ? (
        <CloudOffIcon className="size-3.5" />
      ) : pending > 0 ? (
        <RefreshCwIcon className="size-3.5 animate-spin" />
      ) : (
        <CloudCheckIcon className="size-3.5" />
      )}
      <span className={cn(online && pending === 0 && "sr-only sm:not-sr-only")}>{label}</span>
    </div>
  );
}
