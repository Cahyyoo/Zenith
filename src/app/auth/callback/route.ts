import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only same-origin relative paths are accepted as a post-login target. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function loginWithError(origin: string, message: string) {
  const login = new URL("/login", origin);
  login.searchParams.set("error", message);
  return NextResponse.redirect(login);
}

/** Exchanges the PKCE code from an email confirmation or password reset link for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  // Supabase reports failed links (e.g. "Email link is invalid or has expired")
  // as query params instead of a code.
  const linkError = searchParams.get("error_description") ?? searchParams.get("error");
  if (linkError) return loginWithError(origin, linkError);

  const code = searchParams.get("code");
  if (!code) return loginWithError(origin, "Sign-in link is missing its code. Please try again.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginWithError(origin, error.message);

  return NextResponse.redirect(new URL(safeNext(searchParams.get("next")), origin));
}
