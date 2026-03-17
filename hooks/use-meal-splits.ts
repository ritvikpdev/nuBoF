"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMealSplits,
  createSplit,
  updateSplit,
  deleteSplit,
} from "@/services/meal-splits";
import type { MealSplit } from "@/types";

/** Fetches all meal splits for a user, ordered by display_order. */
export function useMealSplits(userId: string | undefined) {
  return useQuery({
    queryKey: ["mealSplits", userId],
    queryFn: () => getMealSplits(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Creates a new meal split with an optimistic cache update to avoid a visible flicker. */
export function useCreateSplit(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      percentage,
      display_order,
    }: {
      name: string;
      percentage: number;
      display_order: number;
    }) => createSplit(userId!, name, percentage, display_order),

    onMutate: async ({ name, percentage, display_order }) => {
      await queryClient.cancelQueries({ queryKey: ["mealSplits", userId] });
      const snapshot = queryClient.getQueryData<MealSplit[]>(["mealSplits", userId]);

      // Append a temporary optimistic entry; it will be replaced with the real
      // row (including the server-assigned id) when onSettled invalidates.
      const optimistic: MealSplit = {
        id:            `opt-${Date.now()}`,
        user_id:       userId ?? "",
        name,
        percentage,
        display_order,
        created_at:    new Date().toISOString(),
      };

      queryClient.setQueryData<MealSplit[]>(
        ["mealSplits", userId],
        (old) => [...(old ?? []), optimistic],
      );

      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["mealSplits", userId], context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["mealSplits", userId] });
    },
  });
}

/** Updates a meal split and re-fetches the list. */
export function useUpdateSplit(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      splitId,
      updates,
    }: {
      splitId: string;
      updates: Partial<Pick<MealSplit, "name" | "percentage" | "display_order">>;
    }) => updateSplit(splitId, updates),

    // Optimistically update the cache so the UI feels instant.
    onMutate: async ({ splitId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["mealSplits", userId] });
      const snapshot = queryClient.getQueryData<MealSplit[]>(["mealSplits", userId]);
      queryClient.setQueryData<MealSplit[]>(
        ["mealSplits", userId],
        (old) =>
          (old ?? []).map((s) => (s.id === splitId ? { ...s, ...updates } : s)),
      );
      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["mealSplits", userId], context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["mealSplits", userId] });
    },
  });
}

/** Deletes a meal split and re-fetches the list. */
export function useDeleteSplit(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (splitId: string) => deleteSplit(splitId),

    onMutate: async (splitId) => {
      await queryClient.cancelQueries({ queryKey: ["mealSplits", userId] });
      const snapshot = queryClient.getQueryData<MealSplit[]>(["mealSplits", userId]);
      queryClient.setQueryData<MealSplit[]>(
        ["mealSplits", userId],
        (old) => (old ?? []).filter((s) => s.id !== splitId),
      );
      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["mealSplits", userId], context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["mealSplits", userId] });
    },
  });
}
