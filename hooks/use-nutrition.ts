"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDailyGoals, getTodayLogs, deleteLog, logFood } from "@/services/nutrition";
import { todayDateStr } from "@/lib/dates";
import { computeDailyTotals } from "@/lib/log-totals";
import type { FoodLogEntry } from "@/types";

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
    staleTime: 30_000,
    select(logs) {
      return { logs, totals: computeDailyTotals(logs) };
    },
  });
}

/**
 * Optimistic delete mutation for food log entries with undo toast.
 *
 * @param userId    Current user ID (or undefined while auth is loading)
 * @param cacheKey  The React Query cache key that holds the FoodLogEntry[] to
 *                  optimistically update. Dashboard passes `["todayLogs", userId]`,
 *                  History passes `["logs", userId, dateStr]`.
 * @param extraInvalidations  Additional query keys to invalidate on success
 *                            (e.g. `["weeklyTrend", userId]`).
 */
export function useDeleteLog(
  userId: string | undefined,
  cacheKey: readonly unknown[],
  extraInvalidations: readonly unknown[][] = [],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => deleteLog(logId),

    onMutate: async (logId) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: cacheKey });
      const snapshot = queryClient.getQueryData<FoodLogEntry[]>(cacheKey);
      const deleted = (snapshot ?? []).find((l) => l.id === logId);

      queryClient.setQueryData<FoodLogEntry[]>(
        cacheKey,
        (old) => (old ?? []).filter((l) => l.id !== logId),
      );

      return { snapshot, deleted };
    },

    onError: (err: Error, _logId, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(cacheKey, context.snapshot);
      }
      toast.error(`Could not remove entry: ${err.message}`);
    },

    onSuccess: (_data, _logId, context) => {
      void queryClient.invalidateQueries({ queryKey: cacheKey });
      for (const key of extraInvalidations) {
        void queryClient.invalidateQueries({ queryKey: key });
      }

      const entry = context?.deleted;
      if (!entry || !userId) {
        toast.success("Entry removed.");
        return;
      }

      toast("Entry removed.", {
        action: {
          label: "Undo",
          onClick: () => {
            void logFood(userId, {
              foodId:        `undo-${entry.id}`,
              name:          entry.food_name     ?? "Unknown food",
              calories:      Number(entry.calories      ?? 0),
              protein_g:     Number(entry.protein_g     ?? 0),
              carbs_g:       Number(entry.carbs_g       ?? 0),
              fat_g:         Number(entry.fat_g         ?? 0),
              iron_mg:       Number(entry.iron_mg       ?? 0),
              potassium_mg:  Number(entry.potassium_mg  ?? 0),
              magnesium_mg:  Number(entry.magnesium_mg  ?? 0),
              vitamin_c_mg:  Number(entry.vitamin_c_mg  ?? 0),
              vitamin_d_mcg: Number(entry.vitamin_d_mcg ?? 0),
            }, entry.meal_split_id ?? null).then(() => {
              void queryClient.invalidateQueries({ queryKey: cacheKey });
              for (const key of extraInvalidations) {
                void queryClient.invalidateQueries({ queryKey: key });
              }
            });
          },
        },
      });
    },
  });
}
