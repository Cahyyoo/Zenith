import { COLOR_CLASSES, type TagColor } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function TagBadge({ name, color, className }: { name: string; color: TagColor; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-32 items-center truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
        COLOR_CLASSES[color].soft,
        className,
      )}
    >
      {name}
    </span>
  );
}
