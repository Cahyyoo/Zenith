import type { Metadata } from "next";

import { ForgotPasswordContainer } from "@/features/auth/forgot-password-container";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordContainer />;
}
