"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorPicker } from "@/components/common/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { tagFormSchema, type TagFormValues } from "../schemas";

type TagFormProps = {
  defaultValues?: TagFormValues;
  submitLabel: string;
  onSubmit: (values: TagFormValues) => void;
  secondaryAction?: ReactNode;
};

export function TagForm({
  defaultValues = { name: "", color: "green" },
  submitLabel,
  onSubmit,
  secondaryAction,
}: TagFormProps) {
  const form = useForm<TagFormValues>({ resolver: zodResolver(tagFormSchema), defaultValues });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="tag-name">Name</Label>
        <Input
          id="tag-name"
          autoFocus
          autoComplete="off"
          placeholder="e.g. Home, Finance"
          aria-invalid={errors.name ? true : undefined}
          {...form.register("name")}
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tag-color">Color</Label>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => <ColorPicker id="tag-color" value={field.value} onChange={field.onChange} />}
        />
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <div>{secondaryAction}</div>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
