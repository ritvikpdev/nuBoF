"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTodayWater, logWater, deleteWaterLog } from "@/services/water";
import type { WaterLog } from "@/types";

const ML_PER_GLASS = 250;

/** Fetches today's water logs and returns entries + total ml consumed. */
export function useWaterToday(userId: string | undefined) {
  return useQuery({
    queryKey: ["waterToday", userId],
    queryFn: () => getTodayWater(userId!),
    enabled: !!userId,
    staleTime: 30_000,
    select(logs) {
      const totalMl = logs.reduce((s, l) => s + l.amount_ml, 0);
      const totalGlasses = Math.floor(totalMl / ML_PER_GLASS);
      return { logs, totalMl, totalGlasses };
    },
  });
}

/** Logs a water intake event with optimistic update. */
export function useLogWater(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amountMl: number) => {
      if (!userId) throw new Error("Not logged in.");
      return logWater(userId, amountMl);
    },

    onMutate: async (amountMl) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["waterToday", userId] });
      const snapshot = queryClient.getQueryData<WaterLog[]>(["waterToday", userId]);

      const optimistic: WaterLog = {
        id:         `opt-${Date.now()}`,
        user_id:    userId,
        date:       new Date().toLocaleDateString("en-CA"),
        amount_ml:  amountMl,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<WaterLog[]>(
        ["waterToday", userId],
        (old) => [...(old ?? []), optimistic],
      );

      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["waterToday", userId], context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["waterToday", userId] });
    },
  });
}

/** Deletes a water log entry with optimistic removal. */
export function useDeleteWaterLog(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => deleteWaterLog(logId),

    onMutate: async (logId) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["waterToday", userId] });
      const snapshot = queryClient.getQueryData<WaterLog[]>(["waterToday", userId]);
      queryClient.setQueryData<WaterLog[]>(
        ["waterToday", userId],
        (old) => (old ?? []).filter((l) => l.id !== logId),
      );
      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["waterToday", userId], context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["waterToday", userId] });
    },
  });
}

export { ML_PER_GLASS };
