"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { credentialsSchema, type Credentials } from "../schemas";

type CredentialsFormProps = {
  mode: "sign-in" | "sign-up";
  pending: boolean;
  onSubmit: (values: Credentials) => void;
  /** Rendered beside the password label, e.g. a "Forgot password?" link. */
  passwordAction?: ReactNode;
};

export function CredentialsForm({ mode, pending, onSubmit, passwordAction }: CredentialsFormProps) {
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={errors.email ? true : undefined}
          className="h-10"
          {...form.register("email")}
        />
        {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          {passwordAction}
        </div>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          aria-invalid={errors.password ? true : undefined}
          className="h-10"
          {...form.register("password")}
        />
        {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
      </div>
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
        {mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
