"use client";

import { useAuth } from "@/components/providers/auth-provider";

/**
 * Returns the current Supabase user and auth loading state.
 *
 * @example
 * const { user, isLoading } = useUser();
 * if (!isLoading && !user) redirect("/auth/login");
 */
export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
