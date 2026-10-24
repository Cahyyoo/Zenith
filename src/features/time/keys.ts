export type EntryKind = "task" | "issue";

export const timeKeys = {
  all: ["time"] as const,
  range: (kind: EntryKind, from: string, to: string) => [...timeKeys.all, kind, from, to] as const,
  item: (kind: EntryKind, id: string) => [...timeKeys.all, kind, "item", id] as const,
};
