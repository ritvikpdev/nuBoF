"use client";

import { useAuth } from "@/components/providers/auth-provider";

/**
 * Returns the current Supabase session and auth loading state.
 * Useful when you need the raw session (e.g., to read the access token).
 *
 * @example
 * const { session } = useSession();
 * const token = session?.access_token;
 */
export function useSession() {
  const { session, isLoading } = useAuth();
  return { session, isLoading };
}
