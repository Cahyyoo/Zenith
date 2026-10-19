import { z } from "zod";

const email = z.email("Enter a valid email address");
const password = z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters");

export const credentialsSchema = z.object({ email, password });
export type Credentials = z.infer<typeof credentialsSchema>;

export const emailSchema = z.object({ email });
export type EmailValues = z.infer<typeof emailSchema>;

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((values) => values.password === values.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
