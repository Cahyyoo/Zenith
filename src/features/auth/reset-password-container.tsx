"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Splash } from "@/components/common/splash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";
import { getSupabase } from "@/lib/supabase/client";

import { AuthCard } from "./components/auth-card";
import { newPasswordSchema, type NewPasswordValues } from "./schemas";
import { useSession } from "./session-provider";

/**
 * Reached from the reset email via /auth/callback, which has already turned
 * the link into a recovery session. Without a session the link was invalid.
 */
export function ResetPasswordContainer() {
  const { status, user } = useSession();

  if (status === "loading") return <Splash />;

  if (status === "unauthenticated") {
    return (
      <AuthCard
        title="Link expired"
        description="This reset link is invalid or has expired. Request a new one to continue."
      >
        <Button asChild size="lg" className="h-10">
          <Link href={routes.forgotPassword}>Request a new link</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="self-center text-muted-foreground">
          <Link href={routes.login}>Back to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" description={`For ${user.email ?? "your account"}.`}>
      <NewPasswordForm />
    </AuthCard>
  );
}

function NewPasswordForm() {
  const router = useRouter();
  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async ({ password }: NewPasswordValues) => {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) {
      toast.error("Couldn't update your password", { description: error.message });
      return;
    }
    toast.success("Password updated");
    router.replace("/");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={errors.password ? true : undefined}
          className="h-10"
          {...form.register("password")}
        />
        {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirm ? true : undefined}
          className="h-10"
          {...form.register("confirm")}
        />
        {errors.confirm ? <p className="text-xs text-destructive">{errors.confirm.message}</p> : null}
      </div>
      <Button type="submit" size="lg" className="h-10" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
