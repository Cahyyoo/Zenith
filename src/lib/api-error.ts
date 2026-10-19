import type { PostgrestError } from "@supabase/supabase-js";

/** Normalized error thrown by every Supabase call in the data layer. */
export class ApiError extends Error {
  readonly code: string;
  readonly isNetwork: boolean;

  constructor(message: string, code: string, isNetwork: boolean) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.isNetwork = isNetwork;
  }
}

const NETWORK_MESSAGE = /failed to fetch|networkerror|network request failed|load failed|fetch failed/i;

export function toApiError(error: PostgrestError | Error): ApiError {
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  return new ApiError(error.message, code, code === "" && NETWORK_MESSAGE.test(error.message));
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.isNetwork;
  return error instanceof TypeError && NETWORK_MESSAGE.test(error.message);
}

/**
 * Primary-key unique_violation: a replayed insert that already reached the
 * server. Other unique constraints (e.g. duplicate names) are real errors.
 */
export function isReplayedInsert(error: unknown, table: string): boolean {
  return (
    error instanceof ApiError &&
    error.code === "23505" &&
    error.message.includes(`"${table}_pkey"`)
  );
}

export function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) throw toApiError(result.error);
  if (result.data === null) throw new ApiError("Empty response", "EMPTY", false);
  return result.data;
}

/** For writes whose response body we do not need. */
export function check(result: { error: PostgrestError | null }): void {
  if (result.error) throw toApiError(result.error);
}
