"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useSavedMeals, useDeleteMeal, useLogMeal } from "@/hooks/use-meals";
import type { SavedMealWithIngredients } from "@/hooks/use-meals";
import { MealCard } from "./_components/meal-card";
import { Skeleton } from "@/components/ui/skeleton";

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

  const deleteMutation = useDeleteMeal();
  const logMutation    = useLogMeal();

  function handleLog(meal: SavedMealWithIngredients) {
    if (!user) return;
    logMutation.mutate(
      { userId: user.id, meal },
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

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saved Meals</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your go-to combinations, one tap to log
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

        {/* ── Loading ── */}
        {isLoading && <MealsSkeleton />}

        {/* ── Empty ── */}
        {!isLoading && meals?.length === 0 && <EmptyState />}

        {/* ── Meal list ── */}
        {!isLoading && meals && meals.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {meals.length} meal{meals.length !== 1 ? "s" : ""}
            </p>
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
    </div>
  );
}
