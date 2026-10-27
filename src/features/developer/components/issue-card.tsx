import { CloudUploadIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { ElapsedBadge } from "@/features/time/components/elapsed-badge";
import { ISSUE_TYPE_LABEL } from "@/lib/domain";
import type { WorkSchedule } from "@/lib/work-schedule";
import { cn } from "@/lib/utils";

import type { Issue } from "../types";
import { PriorityIcon, TypeIcon, issueDisplayId } from "./issue-meta";

type IssueCardProps = ComponentProps<"div"> & {
  issue: Issue;
  projectKey: string;
  dragging?: boolean;
  overlay?: boolean;
  /** Working hours for the live timer (time outside them is not counted). */
  schedule?: WorkSchedule;
};

export function IssueCard({ issue, projectKey, dragging, overlay, schedule, className, ...props }: IssueCardProps) {
  const unsynced = issue.number === null;

  return (
    <div
      className={cn(
        "group flex flex-col gap-1.5 rounded-[var(--radius)] border bg-card p-2.5 text-left text-card-foreground shadow-xs transition-[border-color,box-shadow,opacity] duration-150 outline-none animate-in fade-in-0 zoom-in-95 hover:border-foreground/20 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring",
        dragging && "opacity-40 shadow-none",
        overlay && "rotate-1 cursor-grabbing shadow-lg ring-1 ring-primary/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          {issueDisplayId(projectKey, issue.number)}
          {unsynced ? <CloudUploadIcon aria-label="Not synced yet" className="size-3" /> : null}
        </span>
        <PriorityIcon priority={issue.priority} />
      </div>
      <p className="line-clamp-3 text-[13px] leading-snug font-medium">{issue.title}</p>
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <TypeIcon type={issue.type} />
        {ISSUE_TYPE_LABEL[issue.type]}
        {issue.status === "in_progress" ? (
          <ElapsedBadge since={issue.status_changed_at ?? null} schedule={schedule} className="ml-auto" />
        ) : null}
      </span>
    </div>
  );
}
