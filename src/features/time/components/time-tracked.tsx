"use client";

import { format } from "date-fns";
import { ClockIcon } from "lucide-react";

import { formatDuration, type Session } from "../lib/time";

type TimeTrackedProps = {
  sessions: Session[];
  now: number;
  /** How many of the latest sessions to list. */
  limit?: number;
};

/** "Time tracked: 3h 20m · 4 sessions" with the most recent sessions. */
export function TimeTracked({ sessions, now, limit = 5 }: TimeTrackedProps) {
  const totalMs = sessions.reduce((sum, session) => sum + Math.max(0, (session.end ?? now) - session.start), 0);
  const recent = [...sessions].sort((a, b) => b.start - a.start).slice(0, limit);

  return (
    <section aria-label="Time tracked" className="flex flex-col gap-2 rounded-[var(--radius)] border bg-muted/30 p-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold">
        <ClockIcon className="size-3.5 text-muted-foreground" />
        Time tracked
        <span className="ml-auto font-semibold tabular-nums">{formatDuration(totalMs)}</span>
        <span className="font-normal text-muted-foreground">
          · {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </h3>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">No time yet. It starts when this moves to In Progress.</p>
      ) : (
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground tabular-nums">
          {recent.map((session) => (
            <li key={session.id} className="flex justify-between gap-2">
              <span>
                {format(session.start, "EEE d MMM, HH:mm")}–{session.end === null ? "now" : format(session.end, "HH:mm")}
              </span>
              <span className={session.end === null ? "font-semibold text-primary" : "text-foreground"}>
                {formatDuration(Math.max(0, (session.end ?? now) - session.start))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
