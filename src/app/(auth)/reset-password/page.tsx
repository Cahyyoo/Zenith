import type { Metadata } from "next";

import { ResetPasswordContainer } from "@/features/auth/reset-password-container";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return <ResetPasswordContainer />;
}
