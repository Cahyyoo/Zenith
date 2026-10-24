"use client";

import { ListTodoIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { todayIso } from "@/lib/dates";
import { COLOR_CLASSES } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { InlineTaskInput } from "../components/inline-task-input";
import { TaskForm } from "../components/task-form";
import { TaskList, type TaskRow } from "../components/task-list";
import { useTagMap, useTags, useTaskActions, useTasks } from "../hooks";
import { sortTasks } from "../lib/sort";
import type { Task } from "../types";

export function TaskListContainer() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get("tag");

  const tasksQuery = useTasks();
  const { data: tags = [] } = useTags();
  const tagMap = useTagMap();
  const actions = useTaskActions();
  const [today] = useState(todayIso);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeTag = tagFilter ? tagMap.get(tagFilter) : undefined;

  const { open, completed } = useMemo(() => {
    const rows: TaskRow[] = sortTasks(tasksQuery.data ?? [])
      .filter((task) => !tagFilter || task.tag_ids.includes(tagFilter))
      .map((task) => ({
        task,
        tags: task.tag_ids.flatMap((id) => {
          const tag = tagMap.get(id);
          return tag ? [tag] : [];
        }),
      }));
    return {
      open: rows.filter((row) => !row.task.completed),
      completed: rows.filter((row) => row.task.completed),
    };
  }, [tasksQuery.data, tagFilter, tagMap]);

  const editingTask = editingId ? tasksQuery.data?.find((task) => task.id === editingId) : undefined;

  const handleDelete = (task: Task) => {
    actions.deleteTask(task);
    setEditingId(null);
    toast("Task deleted", {
      description: task.title,
      action: { label: "Undo", onClick: () => actions.restoreTask(task) },
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        title={activeTag ? activeTag.name : "Tasks"}
        description={
          open.length === 0 ? "Nothing on your plate." : `${open.length} open ${open.length === 1 ? "task" : "tasks"}`
        }
      />

      {tags.length > 0 ? (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden" aria-label="Filter by tag">
          <FilterChip href="/p" active={!tagFilter} label="All" />
          {tags.map((tag) => (
            <FilterChip
              key={tag.id}
              href={`/p?tag=${tag.id}`}
              active={tagFilter === tag.id}
              label={tag.name}
              dotClass={COLOR_CLASSES[tag.color].dot}
            />
          ))}
        </div>
      ) : null}

      <div className="mb-4 hidden md:block">
        <InlineTaskInput
          placeholder="Add a task and press Enter"
          onCreate={(title) =>
            actions.createTask({ title, notes: "", due_date: null, tag_ids: tagFilter ? [tagFilter] : [] })
          }
        />
      </div>

      {tasksQuery.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-[var(--radius)]" />
          ))}
        </div>
      ) : open.length === 0 && completed.length === 0 ? (
        <EmptyState
          icon={ListTodoIcon}
          title={activeTag ? `No tasks tagged ${activeTag.name}` : "No tasks yet"}
          description="Tap + to add your first one."
        />
      ) : (
        <TaskList
          open={open}
          completed={completed}
          today={today}
          onToggle={(task, value) => actions.setCompleted(task.id, value)}
          onOpen={(task) => setEditingId(task.id)}
          onDelete={handleDelete}
          onStart={(task) => actions.startTask(task.id)}
          onPause={(task) => actions.pauseTask(task.id)}
        />
      )}

      <ResponsiveDialog
        open={editingTask !== undefined}
        onOpenChange={(value) => {
          if (!value) setEditingId(null);
        }}
        title="Edit task"
      >
        {editingTask ? (
          <TaskForm
            key={editingTask.id}
            tags={tags}
            submitLabel="Save"
            defaultValues={{
              title: editingTask.title,
              notes: editingTask.notes,
              due_date: editingTask.due_date,
              tag_ids: editingTask.tag_ids,
            }}
            onSubmit={(values) => {
              actions.updateTask(editingTask.id, values);
              setEditingId(null);
            }}
            secondaryAction={
              <Button type="button" variant="destructive" onClick={() => handleDelete(editingTask)}>
                <Trash2Icon />
                Delete
              </Button>
            }
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}

function FilterChip({ href, label, active, dotClass }: { href: string; label: string; active: boolean; dotClass?: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
      )}
    >
      {dotClass ? <span className={cn("size-2 rounded-full", dotClass)} /> : null}
      {label}
    </Link>
  );
}
