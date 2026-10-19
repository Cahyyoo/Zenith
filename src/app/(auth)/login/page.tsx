import type { Metadata } from "next";
import { Suspense } from "react";

import { Splash } from "@/components/common/splash";
import { LoginContainer } from "@/features/auth/login-container";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Splash />}>
      <LoginContainer />
    </Suspense>
  );
}
