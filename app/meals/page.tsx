"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useSavedMeals, useDeleteMeal, useLogMeal } from "@/hooks/use-meals";
import type { SavedMealWithIngredients } from "@/hooks/use-meals";
import { useCustomFoods, useDeleteCustomFood } from "@/hooks/use-custom-foods";
import type { CustomFood } from "@/types/nutrition";
import { MealCard } from "./_components/meal-card";
import { CustomFoodSheet } from "@/app/search/_components/custom-food-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TrashIcon } from "@/components/ui/icons";

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function MealsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <div className="flex gap-3 items-baseline">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🍱</div>
      <h2 className="text-lg font-semibold text-foreground mb-1">No saved meals yet</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Save your favourite combinations and add them to your log with a single tap.
      </p>
      <Link
        href="/meals/create"
        className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors"
      >
        Create Your First Meal
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MealsPage() {
  const { user } = useUser();

  const { data: meals, isLoading, error } = useSavedMeals(user?.id);
  const { data: customFoods = [], isLoading: customLoading } = useCustomFoods(user?.id);

  const deleteMutation       = useDeleteMeal();
  const logMutation          = useLogMeal();
  const deleteCustomMutation = useDeleteCustomFood(user?.id);

  const [customSheetOpen, setCustomSheetOpen] = useState(false);

  function handleLog(meal: SavedMealWithIngredients, mealSplitId?: string | null) {
    if (!user) return;
    logMutation.mutate(
      { userId: user.id, meal, mealSplitId },
      {
        onSuccess: () => toast.success(`${meal.meal_name} added to today's log.`),
        onError:   (err: Error) => toast.error(err.message),
      },
    );
  }

  function handleDelete(mealId: string) {
    if (!user) return;
    deleteMutation.mutate(
      { mealId, userId: user.id },
      {
        onSuccess: () => toast.success("Meal deleted."),
        onError:   (err: Error) => toast.error(err.message),
      },
    );
  }

  function handleDeleteCustomFood(foodId: string) {
    deleteCustomMutation.mutate(foodId, {
      onSuccess: () => toast.success("Custom food deleted."),
      onError:   (err: Error) => toast.error(err.message),
    });
  }

  return (
    <>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meals & Foods</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Saved meals and your custom food library
              </p>
            </div>
            <Link
              href="/meals/create"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              New Meal
            </Link>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-4">
              <p className="text-sm text-destructive font-medium">
                Could not load meals: {error.message}
              </p>
            </div>
          )}

          {/* ── Saved Meals section ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Saved Meals
              </p>
            </div>

            {isLoading && <MealsSkeleton />}
            {!isLoading && meals?.length === 0 && <EmptyState />}

            {!isLoading && meals && meals.length > 0 && (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {meals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      onLog={handleLog}
                      onDelete={handleDelete}
                      isLogging={logMutation.isPending && logMutation.variables?.meal.id === meal.id}
                      isDeleting={deleteMutation.isPending && deleteMutation.variables?.mealId === meal.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Custom Ingredients section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Custom Ingredients
              </p>
              <button
                onClick={() => setCustomSheetOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Create Ingredient
              </button>
            </div>

            {customLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!customLoading && customFoods.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="text-3xl mb-3">🥫</p>
                <p className="text-sm font-medium text-foreground mb-1">No custom foods yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create foods not in the database and reuse them anywhere.
                </p>
                <button
                  onClick={() => setCustomSheetOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition-colors"
                >
                  + Create Custom Food
                </button>
              </div>
            )}

            {!customLoading && customFoods.length > 0 && (
              <div className="space-y-2">
                <AnimatePresence>
                  {customFoods.map((food: CustomFood) => (
                    <motion.div
                      key={food.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {food.name}
                          </p>
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            Custom
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          per {food.serving_size}{food.serving_unit} ·{" "}
                          <span className="font-medium text-foreground">{food.calories} kcal</span>
                          {" · "}P {food.protein_g}g · C {food.carbs_g}g · F {food.fat_g}g
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCustomFood(food.id)}
                        disabled={
                          deleteCustomMutation.isPending &&
                          deleteCustomMutation.variables === food.id
                        }
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 disabled:opacity-40"
                        aria-label={`Delete ${food.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>

      {user && (
        <CustomFoodSheet
          isOpen={customSheetOpen}
          onClose={() => setCustomSheetOpen(false)}
          userId={user.id}
        />
      )}
    </>
  );
}
