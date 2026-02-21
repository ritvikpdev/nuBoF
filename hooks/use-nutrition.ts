"use client";

import { useQuery } from "@tanstack/react-query";
import { getDailyGoals, getTodayLogs } from "@/services/nutrition";
import { computeDailyTotals } from "@/lib/log-totals";

/** Fetches the user's daily nutrition goals, cached by React Query. */
export function useDailyGoals(userId: string | undefined) {
  return useQuery({
    queryKey: ["dailyGoals", userId],
    queryFn: () => getDailyGoals(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetches today's food logs and computes running totals in a single query. */
export function useTodayLogs(userId: string | undefined) {
  return useQuery({
    queryKey: ["todayLogs", userId],
    queryFn: () => getTodayLogs(userId!),
    enabled: !!userId,
    // Shorter stale window than the default so background refetches happen more
    // promptly after tab-switches, supplementing the explicit cache invalidations
    // that fire after every mutation.
    staleTime: 30_000,
    select(logs) {
      return { logs, totals: computeDailyTotals(logs) };
    },
  });
}
