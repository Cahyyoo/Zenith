import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export type ZenithClient = SupabaseClient<Database>;

let browserClient: ZenithClient | undefined;

/** Singleton browser client. Session lives in cookies managed by @supabase/ssr. */
export function getSupabase(): ZenithClient {
  browserClient ??= createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return browserClient;
}
