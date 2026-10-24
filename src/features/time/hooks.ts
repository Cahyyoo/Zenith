"use client";

import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { fetchEntries, fetchItemEntries } from "./api";
import { timeKeys, type EntryKind } from "./keys";

/** Time-entry rows overlapping a range; keeps the previous month visible while the next loads. */
export function useEntries(kind: EntryKind, range: { from: string; to: string }) {
  return useQuery({
    queryKey: timeKeys.range(kind, range.from, range.to),
    queryFn: () => fetchEntries(kind, range.from, range.to),
    placeholderData: keepPreviousData,
  });
}

/** Every session of one task or issue (for "time tracked" totals). */
export function useItemEntries(kind: EntryKind, itemId: string | null) {
  return useQuery({
    queryKey: timeKeys.item(kind, itemId ?? "none"),
    queryFn: itemId ? () => fetchItemEntries(kind, itemId) : skipToken,
  });
}

// One shared ticker for every live timer on screen. The snapshot is the
// current time rounded to the tick, so it is stable between renders but
// never stale when a timer mounts after a pause.
const TICK = 30_000;
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;

const nowSnapshot = () => Math.floor(Date.now() / TICK) * TICK;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!interval) {
    interval = setInterval(() => listeners.forEach((notify) => notify()), TICK);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && interval) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

/** Current time, refreshed every 30 seconds — enough for minute-level timers. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, nowSnapshot, () => 0);
}
