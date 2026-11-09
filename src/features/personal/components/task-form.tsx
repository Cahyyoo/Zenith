"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { DatePicker } from "@/components/common/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/dates";

import { taskFormSchema, type TaskFormValues } from "../schemas";
import type { Tag } from "../types";
import { ReminderPicker, TimeField } from "./reminder-fields";
import { RepeatPicker } from "./repeat-picker";
import { TagPicker } from "./tag-picker";

export const EMPTY_TASK: TaskFormValues = {
  title: "",
  notes: "",
  due_date: null,
  due_time: null,
  recurrence: null,
  remind_offset_minutes: null,
  tag_ids: [],
};

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
  const [today] = useState(todayIso);
  const dueDate = useWatch({ control: form.control, name: "due_date" });
  const dueTime = useWatch({ control: form.control, name: "due_time" });

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
        <Label htmlFor="task-due">Due</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Controller
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <DatePicker id="task-due" value={field.value} onChange={field.onChange} emptyLabel="No due date" />
            )}
          />
          <Controller
            control={form.control}
            name="due_time"
            render={({ field }) => (
              <TimeField
                id="task-time"
                value={field.value}
                disabled={!dueDate}
                onChange={(time) => {
                  field.onChange(time);
                  // A newly timed task reminds at that time by default.
                  if (time && !field.value && form.getValues("remind_offset_minutes") === null) {
                    form.setValue("remind_offset_minutes", 0);
                  }
                }}
              />
            )}
          />
        </div>
        {errors.due_date ? <p className="text-xs text-destructive">{errors.due_date.message}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor="task-repeat">Repeat</Label>
          <Controller
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <RepeatPicker
                id="task-repeat"
                value={field.value}
                dueDate={dueDate}
                today={today}
                onChange={(rule) => {
                  field.onChange(rule);
                  // Repeating needs a starting date; default to today.
                  if (rule && !form.getValues("due_date")) form.setValue("due_date", today, { shouldValidate: true });
                }}
              />
            )}
          />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor="task-reminder">Reminder</Label>
          <Controller
            control={form.control}
            name="remind_offset_minutes"
            render={({ field }) => (
              <ReminderPicker id="task-reminder" value={field.value} onChange={field.onChange} disabled={!dueTime} />
            )}
          />
          {!dueTime ? <p className="text-xs text-muted-foreground">Set a time to get a notification.</p> : null}
        </div>
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
