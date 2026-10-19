"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorDot } from "@/components/common/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_LABEL,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABEL,
  ISSUE_TYPES,
  ISSUE_TYPE_LABEL,
} from "@/lib/domain";

import { issueFormSchema, type IssueFormValues } from "../schemas";
import type { Project } from "../types";
import { EnumSelect } from "./enum-select";
import { PriorityIcon, StatusIcon, TypeIcon } from "./issue-meta";
import { MarkdownEditor } from "./markdown";

type IssueFormProps = {
  defaultValues: IssueFormValues;
  /** When provided, the issue's project can be chosen (quick add). */
  projects?: Project[];
  submitLabel: string;
  onSubmit: (values: IssueFormValues) => void;
  secondaryAction?: ReactNode;
};

export function IssueForm({ defaultValues, projects, submitLabel, onSubmit, secondaryAction }: IssueFormProps) {
  const form = useForm<IssueFormValues>({ resolver: zodResolver(issueFormSchema), defaultValues });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {projects ? (
        <div className="grid gap-1.5">
          <Label htmlFor="issue-project">Project</Label>
          <Controller
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="issue-project" className="w-full" aria-invalid={errors.project_id ? true : undefined}>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <ColorDot color={project.color} />
                      <span className="font-mono text-xs text-muted-foreground">{project.key}</span>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.project_id ? <p className="text-xs text-destructive">{errors.project_id.message}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="issue-title">Title</Label>
        <Input
          id="issue-title"
          autoComplete="off"
          placeholder="Short summary of the issue"
          aria-invalid={errors.title ? true : undefined}
          {...form.register("title")}
        />
        {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="issue-type">Type</Label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <EnumSelect
                id="issue-type"
                value={field.value}
                options={ISSUE_TYPES}
                labels={ISSUE_TYPE_LABEL}
                renderIcon={(value) => <TypeIcon type={value} />}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="issue-priority">Priority</Label>
          <Controller
            control={form.control}
            name="priority"
            render={({ field }) => (
              <EnumSelect
                id="issue-priority"
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
          <Label htmlFor="issue-status">Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <EnumSelect
                id="issue-status"
                value={field.value}
                options={ISSUE_STATUSES}
                labels={ISSUE_STATUS_LABEL}
                renderIcon={(value) => <StatusIcon status={value} />}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="issue-description">Description</Label>
        <Controller
          control={form.control}
          name="description_md"
          render={({ field }) => (
            <MarkdownEditor
              id="issue-description"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={"Steps to reproduce, expected behaviour, logs…\n\n```ts\n// code\n```"}
            />
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>{secondaryAction}</div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
