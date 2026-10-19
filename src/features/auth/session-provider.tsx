"use client";

import { isAuthRetryableFetchError, type User } from "@supabase/supabase-js";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { queryPersister } from "@/lib/query/persister";
import { getSupabase } from "@/lib/supabase/client";

export type SessionUser = { id: string; email: string | null };

type SessionState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated"; user: null };

type SessionContextValue = SessionState & { signOut: () => Promise<void> };

const SessionContext = createContext<SessionContextValue | null>(null);

// The last signed-in user is remembered so the app keeps working offline
// when the access token expires and cannot be refreshed until reconnecting.
const CACHED_USER_KEY = "zenith-user";

function readCachedUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      typeof parsed.id === "string"
    ) {
      const email = "email" in parsed && typeof parsed.email === "string" ? parsed.email : null;
      return { id: parsed.id, email };
    }
  } catch {
    // Ignore unreadable storage.
  }
  return null;
}

async function clearLocalData(queryClient: QueryClient) {
  queryClient.getMutationCache().clear();
  queryClient.clear();
  await queryPersister.removeClient();
  localStorage.removeItem(CACHED_USER_KEY);
}

function toSessionUser(user: User): SessionUser {
  return { id: user.id, email: user.email ?? null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: "loading", user: null });

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    const authenticate = (user: SessionUser) => {
      const previous = readCachedUser();
      if (previous && previous.id !== user.id) {
        // A different account on this device: never show the previous cache.
        void clearLocalData(queryClient);
      }
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
      // Token refreshes fire this too; keep the same object to avoid re-renders.
      setState((current) =>
        current.status === "authenticated" &&
        current.user.id === user.id &&
        current.user.email === user.email
          ? current
          : { status: "authenticated", user },
      );
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (data.session) {
        authenticate(toSessionUser(data.session.user));
        return;
      }
      const cached = error && isAuthRetryableFetchError(error) ? readCachedUser() : null;
      setState(cached ? { status: "authenticated", user: cached } : { status: "unauthenticated", user: null });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        authenticate(toSessionUser(session.user));
      } else if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", user: null });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut({ scope: "local" });
    await clearLocalData(queryClient);
    setState({ status: "unauthenticated", user: null });
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(() => ({ ...state, signOut }), [state, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within <SessionProvider>");
  return context;
}

/** For components rendered behind <AuthGate>, where a user is guaranteed. */
export function useUser(): SessionUser {
  const session = useSession();
  if (session.status !== "authenticated") throw new Error("useUser requires an authenticated session");
  return session.user;
}
