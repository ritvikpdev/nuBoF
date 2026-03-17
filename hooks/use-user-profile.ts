"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/user";

/** Fetches the user's profile (name, goals etc.) from the users table. */
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes — profile changes rarely
  });
}
