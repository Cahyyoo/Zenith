"use client";

import { PlusIcon, TagIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ColorDot } from "@/components/common/color-picker";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listItemVariants } from "@/lib/motion";

import { TagForm } from "../components/tag-form";
import { useTagActions, useTags, useTasks } from "../hooks";
import type { Tag } from "../types";

type Editing = { mode: "create" } | { mode: "edit"; tag: Tag } | null;

export function TagManagerContainer() {
  const tagsQuery = useTags();
  const { data: tasks } = useTasks();
  const actions = useTagActions();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);

  const openCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks ?? []) {
      if (task.completed) continue;
      for (const id of task.tag_ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const tags = tagsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        title="Tags"
        description="Color labels to group your routines."
        actions={
          <Button onClick={() => setEditing({ mode: "create" })}>
            <PlusIcon />
            New tag
          </Button>
        }
      />

      {tagsQuery.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-[var(--radius)]" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No tags yet"
          description="Create tags like Home or Finance to group tasks."
          action={
            <Button variant="outline" onClick={() => setEditing({ mode: "create" })}>
              Create a tag
            </Button>
          }
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-[var(--radius)] border bg-card">
          <AnimatePresence initial={false}>
            {tags.map((tag) => {
              const count = openCounts.get(tag.id) ?? 0;
              return (
                <motion.li
                  key={tag.id}
                  layout="position"
                  variants={listItemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <ColorDot color={tag.color} className="size-3 transition-colors" />
                    <Link href={`/p?tag=${tag.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {tag.name}
                    </Link>
                    <span className="text-xs text-muted-foreground tabular-nums">{count} open</span>
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ mode: "edit", tag })}>
                      Edit
                    </Button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.mode === "edit" ? "Edit tag" : "New tag"}
      >
        {editing?.mode === "edit" ? (
          <TagForm
            key={editing.tag.id}
            submitLabel="Save"
            defaultValues={{ name: editing.tag.name, color: editing.tag.color }}
            onSubmit={(values) => {
              actions.updateTag(editing.tag.id, values);
              setEditing(null);
            }}
            secondaryAction={
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setDeleting(editing.tag);
                  setEditing(null);
                }}
              >
                <Trash2Icon />
                Delete
              </Button>
            }
          />
        ) : editing?.mode === "create" ? (
          <TagForm
            submitLabel="Create tag"
            onSubmit={(values) => {
              actions.createTag(values);
              setEditing(null);
            }}
          />
        ) : null}
      </ResponsiveDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete "${deleting?.name ?? ""}"?`}
        description="The tag is removed from all tasks. The tasks themselves stay."
        confirmLabel="Delete tag"
        onConfirm={() => {
          if (deleting) actions.deleteTag(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
