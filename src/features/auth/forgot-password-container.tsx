"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";
import { getSupabase } from "@/lib/supabase/client";

import { AuthCard } from "./components/auth-card";
import { InboxNotice } from "./components/inbox-notice";
import { emailSchema, type EmailValues } from "./schemas";

function BackToSignIn() {
  return (
    <Button asChild variant="ghost" size="sm" className="self-center text-muted-foreground">
      <Link href={routes.login}>
        <ArrowLeftIcon />
        Back to sign in
      </Link>
    </Button>
  );
}

export function ForgotPasswordContainer() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async ({ email }: EmailValues) => {
    // The link comes back through /auth/callback, which turns it into a
    // short-lived recovery session and forwards to the reset screen.
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(routes.resetPassword)}`;
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      toast.error("Couldn't send the reset link", { description: error.message });
      return;
    }
    setSentTo(email);
  };

  return (
    <AuthCard title="Reset your password" description="Enter your account email and we'll send you a reset link.">
      {sentTo ? (
        <>
          <InboxNotice
            message={`If an account exists for ${sentTo}, we sent a link to reset your password. Open it in this browser.`}
          />
          <BackToSignIn />
        </>
      ) : (
        <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                aria-invalid={errors.email ? true : undefined}
                className="h-10"
                {...form.register("email")}
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>
            <Button type="submit" size="lg" className="h-10" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
              Send reset link
            </Button>
          </form>
          <BackToSignIn />
        </>
      )}
    </AuthCard>
  );
}
