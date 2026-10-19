import { Suspense, type ReactNode } from "react";

import { Splash } from "@/components/common/splash";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGate } from "@/features/auth/auth-gate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Splash />}>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </Suspense>
  );
}
