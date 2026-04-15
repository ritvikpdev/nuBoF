import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSavedMeals,
  createSavedMeal,
  deleteSavedMeal,
  logSavedMeal,
} from "@/services/meals";
import type { DraftIngredient, SavedMealWithIngredients } from "@/types";

export type { DraftIngredient, SavedMealWithIngredients };

export function useSavedMeals(userId: string | undefined) {
  return useQuery({
    queryKey: ["savedMeals", userId],
    queryFn: () => getSavedMeals(userId!),
    enabled: !!userId,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      name,
      ingredients,
    }: {
      userId: string;
      name: string;
      ingredients: DraftIngredient[];
    }) => createSavedMeal(userId, name, ingredients),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ["savedMeals", userId] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId }: { mealId: string; userId: string }) =>
      deleteSavedMeal(mealId),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ["savedMeals", userId] });
    },
  });
}

export function useLogMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      meal,
      mealSplitId,
    }: {
      userId: string;
      meal: SavedMealWithIngredients;
      mealSplitId?: string | null;
    }) => logSavedMeal(userId, meal, mealSplitId),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ["todayLogs", userId] });
    },
  });
}
