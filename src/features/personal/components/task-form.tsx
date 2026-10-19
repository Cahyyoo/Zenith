"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { taskFormSchema, type TaskFormValues } from "../schemas";
import type { Tag } from "../types";
import { DueDatePicker } from "./due-date-picker";
import { TagPicker } from "./tag-picker";

const EMPTY_TASK: TaskFormValues = { title: "", notes: "", due_date: null, tag_ids: [] };

type TaskFormProps = {
  tags: Tag[];
  defaultValues?: TaskFormValues;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => void;
  secondaryAction?: ReactNode;
};

export function TaskForm({ tags, defaultValues = EMPTY_TASK, submitLabel, onSubmit, secondaryAction }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          autoFocus
          autoComplete="off"
          placeholder="What needs doing?"
          aria-invalid={errors.title ? true : undefined}
          className="h-10 text-base"
          {...form.register("title")}
        />
        {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea id="task-notes" rows={3} placeholder="Optional details" {...form.register("notes")} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="task-due">Due date</Label>
        <Controller
          control={form.control}
          name="due_date"
          render={({ field }) => <DueDatePicker id="task-due" value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Tags</Label>
        <Controller
          control={form.control}
          name="tag_ids"
          render={({ field }) => <TagPicker tags={tags} value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div>{secondaryAction}</div>
        <Button type="submit" size="lg" className="px-5">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
