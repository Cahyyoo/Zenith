import {
  BugIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  RefreshCcwIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
  SparklesIcon,
  TriangleAlertIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import {
  ISSUE_PRIORITY_LABEL,
  ISSUE_STATUS_LABEL,
  ISSUE_TYPE_LABEL,
  type IssuePriority,
  type IssueStatus,
  type IssueType,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

type Meta = { icon: LucideIcon; className: string };

export const TYPE_META: Record<IssueType, Meta> = {
  feature: { icon: SparklesIcon, className: "text-violet-500" },
  bug: { icon: BugIcon, className: "text-red-500" },
  chore: { icon: WrenchIcon, className: "text-slate-500" },
  refactor: { icon: RefreshCcwIcon, className: "text-teal-500" },
};

export const PRIORITY_META: Record<IssuePriority, Meta> = {
  low: { icon: SignalLowIcon, className: "text-muted-foreground" },
  medium: { icon: SignalMediumIcon, className: "text-blue-500" },
  high: { icon: SignalHighIcon, className: "text-orange-500" },
  critical: { icon: TriangleAlertIcon, className: "text-red-600 dark:text-red-400" },
};

export const STATUS_META: Record<IssueStatus, Meta> = {
  backlog: { icon: CircleDashedIcon, className: "text-muted-foreground" },
  todo: { icon: CircleIcon, className: "text-foreground/70" },
  in_progress: { icon: CircleDotIcon, className: "text-amber-500" },
  done: { icon: CircleCheckIcon, className: "text-green-600 dark:text-green-400" },
};

export function TypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const { icon: Icon, className: tone } = TYPE_META[type];
  return <Icon aria-label={ISSUE_TYPE_LABEL[type]} className={cn("size-3.5 shrink-0", tone, className)} />;
}

export function PriorityIcon({ priority, className }: { priority: IssuePriority; className?: string }) {
  const { icon: Icon, className: tone } = PRIORITY_META[priority];
  return (
    <Icon aria-label={`${ISSUE_PRIORITY_LABEL[priority]} priority`} className={cn("size-3.5 shrink-0", tone, className)} />
  );
}

export function StatusIcon({ status, className }: { status: IssueStatus; className?: string }) {
  const { icon: Icon, className: tone } = STATUS_META[status];
  return <Icon aria-label={ISSUE_STATUS_LABEL[status]} className={cn("size-3.5 shrink-0", tone, className)} />;
}

export function issueDisplayId(projectKey: string, number: number | null): string {
  return number === null ? `${projectKey}-…` : `${projectKey}-${number}`;
}
