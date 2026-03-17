"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomFoods,
  createCustomFood,
  deleteCustomFood,
  type CreateCustomFoodInput,
} from "@/services/custom-foods";
import type { CustomFood } from "@/types";

/** Fetches all custom foods for a user. */
export function useCustomFoods(userId: string | undefined) {
  return useQuery({
    queryKey: ["customFoods", userId],
    queryFn: () => getCustomFoods(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Creates a custom food and immediately adds it to the cache. */
export function useCreateCustomFood(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomFoodInput) => createCustomFood(userId!, input),
    onSuccess: (newFood) => {
      queryClient.setQueryData<CustomFood[]>(
        ["customFoods", userId],
        (old) => [newFood, ...(old ?? [])],
      );
    },
  });
}

/** Deletes a custom food and removes it from the cache optimistically. */
export function useDeleteCustomFood(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (foodId: string) => deleteCustomFood(foodId),

    onMutate: async (foodId) => {
      await queryClient.cancelQueries({ queryKey: ["customFoods", userId] });
      const snapshot = queryClient.getQueryData<CustomFood[]>(["customFoods", userId]);
      queryClient.setQueryData<CustomFood[]>(
        ["customFoods", userId],
        (old) => (old ?? []).filter((f) => f.id !== foodId),
      );
      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["customFoods", userId], context.snapshot);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["customFoods", userId] });
    },
  });
}
