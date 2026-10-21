"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorPicker } from "@/components/common/color-picker";
import { DatePicker, type DateShortcut } from "@/components/common/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ISSUE_PRIORITIES, ISSUE_PRIORITY_LABEL } from "@/lib/domain";

import { projectFormSchema, suggestProjectKey, type ProjectFormValues } from "../schemas";
import { EnumSelect } from "./enum-select";
import { PriorityIcon } from "./issue-meta";

const DEADLINE_SHORTCUTS: DateShortcut[] = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

type ProjectFormProps = {
  defaultValues?: ProjectFormValues;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => void;
  secondaryAction?: ReactNode;
};

export function ProjectForm({
  defaultValues = { name: "", key: "", description: "", color: "blue", priority: "medium", target_date: null },
  submitLabel,
  onSubmit,
  secondaryAction,
}: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectFormSchema), defaultValues });
  const { errors, dirtyFields } = form.formState;
  const nameField = form.register("name");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            autoFocus
            autoComplete="off"
            placeholder="Zenith Web"
            aria-invalid={errors.name ? true : undefined}
            {...nameField}
            onChange={(event) => {
              void nameField.onChange(event);
              // Keep suggesting a key until the user edits it themselves.
              if (!dirtyFields.key && !defaultValues.key) {
                form.setValue("key", suggestProjectKey(event.target.value));
              }
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="project-key">Key</Label>
          <Input
            id="project-key"
            autoComplete="off"
            placeholder="ZEN"
            className="font-mono uppercase"
            maxLength={10}
            aria-invalid={errors.key ? true : undefined}
            {...form.register("key")}
          />
        </div>
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        {errors.key ? <p className="col-span-2 text-xs text-destructive">{errors.key.message}</p> : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="project-description">Description</Label>
        <Textarea id="project-description" rows={3} placeholder="What is this project about?" {...form.register("description")} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="project-priority">Priority</Label>
          <Controller
            control={form.control}
            name="priority"
            render={({ field }) => (
              <EnumSelect
                id="project-priority"
                value={field.value}
                options={ISSUE_PRIORITIES}
                labels={ISSUE_PRIORITY_LABEL}
                renderIcon={(value) => <PriorityIcon priority={value} />}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="project-target">Target date</Label>
          <Controller
            control={form.control}
            name="target_date"
            render={({ field }) => (
              <DatePicker
                id="project-target"
                value={field.value}
                onChange={field.onChange}
                emptyLabel="No deadline"
                shortcuts={DEADLINE_SHORTCUTS}
              />
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Issues from high-priority or soon-due projects rank higher in Focus.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="project-color">Color</Label>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => <ColorPicker id="project-color" value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>{secondaryAction}</div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
