"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/lib/routes";
import { getSupabase } from "@/lib/supabase/client";

import { AuthCard } from "./components/auth-card";
import { CredentialsForm } from "./components/credentials-form";
import { InboxNotice } from "./components/inbox-notice";
import type { Credentials } from "./schemas";
import { useSession } from "./session-provider";

function callbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export function LoginContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const shownError = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  // Errors forwarded by /auth/callback (e.g. an expired confirmation link).
  const callbackError = searchParams.get("error");
  useEffect(() => {
    if (!callbackError || shownError.current === callbackError) return;
    shownError.current = callbackError;
    toast.error("Sign-in failed", { description: callbackError });
    router.replace(routes.login);
  }, [callbackError, router]);

  const run = async (action: () => Promise<void>) => {
    setPending(true);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  const signIn = (values: Credentials) =>
    run(async () => {
      const { error } = await getSupabase().auth.signInWithPassword(values);
      if (error) throw error;
    });

  const signUp = (values: Credentials) =>
    run(async () => {
      const { data, error } = await getSupabase().auth.signUp({
        ...values,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) throw error;
      if (!data.session) setConfirmationSentTo(values.email);
    });

  return (
    <AuthCard title="Welcome to Zenith" description="Personal routines and dev projects, in one calm place.">
      {confirmationSentTo ? (
        <InboxNotice message={`We sent a confirmation link to ${confirmationSentTo}.`} />
      ) : (
        <Tabs defaultValue="sign-in" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="sign-up">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <CredentialsForm
              mode="sign-in"
              pending={pending}
              onSubmit={signIn}
              passwordAction={
                <Link
                  href={routes.forgotPassword}
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              }
            />
          </TabsContent>
          <TabsContent value="sign-up">
            <CredentialsForm mode="sign-up" pending={pending} onSubmit={signUp} />
          </TabsContent>
        </Tabs>
      )}
    </AuthCard>
  );
}
