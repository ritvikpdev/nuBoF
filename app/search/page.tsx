"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/use-debounce";
import { useMealSplits } from "@/hooks/use-meal-splits";
import { useCustomFoods } from "@/hooks/use-custom-foods";
import { useSavedMeals, useLogMeal } from "@/hooks/use-meals";
import { searchFoods, logFood, scaleFood } from "@/services/nutrition";
import { toCustomParsedFood } from "@/services/custom-foods";
import type { ParsedFood, FoodLogEntry, MealSplit } from "@/types";
import type { SavedMealWithIngredients } from "@/hooks/use-meals";
import { FoodDetailSheet } from "./_components/food-detail-sheet";
import { CustomFoodSheet } from "./_components/custom-food-sheet";

// ─── Search result skeleton ────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-card rounded-2xl border border-border p-4 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-4 bg-muted rounded-md w-2/3 mb-3" />
          <div className="flex gap-4">
            <div className="h-3 bg-muted rounded w-14" />
            <div className="h-3 bg-muted rounded w-14" />
            <div className="h-3 bg-muted rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  food,
  onSelect,
  isCustom,
}: {
  food: ParsedFood;
  onSelect: (food: ParsedFood) => void;
  isCustom?: boolean;
}) {
  const macros = [
    { label: "P", value: food.protein_g, color: "text-blue-500" },
    { label: "C", value: food.carbs_g,   color: "text-orange-500" },
    { label: "F", value: food.fat_g,     color: "text-amber-500" },
  ];

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(food)}
      className="w-full text-left bg-card rounded-2xl border border-border hover:border-primary/40 active:bg-muted/40 transition-colors p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
              {food.name}
            </p>
            {isCustom && (
              <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Custom
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs font-bold text-foreground tabular-nums">
              {food.calories} <span className="font-normal text-muted-foreground">kcal</span>
            </span>
            {food.servingSize && (
              <span className="text-xs text-muted-foreground">
                per {food.servingSize}{food.servingSizeUnit}
              </span>
            )}
            {macros.map(({ label, value, color }) => (
              <span key={label} className="text-xs text-muted-foreground tabular-nums">
                <span className={`font-semibold ${color}`}>{label}</span>{" "}
                {Math.round(value)}g
              </span>
            ))}
          </div>
        </div>
        <svg
          className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </motion.button>
  );
}

// ─── Saved meal quick-log card ────────────────────────────────────────────────

function SavedMealCard({
  meal,
  mealSplits,
  onLog,
  isLogging,
}: {
  meal: SavedMealWithIngredients;
  mealSplits: MealSplit[];
  onLog: (meal: SavedMealWithIngredients, mealSplitId: string | null) => void;
  isLogging: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-foreground leading-snug truncate">
              {meal.meal_name}
            </p>
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Meal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground tabular-nums">
              {meal.total_calories} <span className="font-normal text-muted-foreground">kcal</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {meal.meal_ingredients.length} ingredient{meal.meal_ingredients.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded((s) => !s)}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          Quick Log
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-border/60">
              {mealSplits.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Add to meal
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mealSplits.map((split) => (
                      <button
                        key={split.id}
                        onClick={() =>
                          setSelectedSplitId((p) => (p === split.id ? null : split.id))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedSplitId === split.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                        }`}
                      >
                        {split.name}
                      </button>
                    ))}
                  </div>
                  {!selectedSplitId && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      No meal selected — will be logged as uncategorized
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  onLog(meal, selectedSplitId);
                  setExpanded(false);
                }}
                disabled={isLogging}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground text-sm font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isLogging ? "Adding…" : `Log ${meal.meal_name}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: mealSplits = [] } = useMealSplits(user?.id);
  const { data: customFoods = [] } = useCustomFoods(user?.id);
  const { data: savedMeals = [] } = useSavedMeals(user?.id);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParsedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<ParsedFood | null>(null);
  const [customSheetOpen, setCustomSheetOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 480);

  // Custom foods matching the current query (client-side, instant)
  const matchingCustomFoods = useMemo<ParsedFood[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return customFoods
      .filter((f) => f.name.toLowerCase().includes(q))
      .map(toCustomParsedFood);
  }, [debouncedQuery, customFoods]);

  // Saved meals filtered by query (or all when no query)
  const matchingSavedMeals = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return savedMeals;
    return savedMeals.filter((m) => m.meal_name.toLowerCase().includes(q));
  }, [debouncedQuery, savedMeals]);

  // ── Auto-focus input on mount ──────────────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Fire USDA search whenever the debounced query changes ──────────────────
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchError(null);
    setIsSearching(true);
    setResults([]);

    searchFoods(trimmed, controller.signal)
      .then((foods) => {
        setResults(foods);
        if (foods.length === 0 && matchingCustomFoods.length === 0) {
          setSearchError("No results. Try a different term or create a custom food.");
        }
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setSearchError(err.message ?? "Search failed. Please try again.");
      })
      .finally(() => setIsSearching(false));
    // matchingCustomFoods intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // ── Log food mutation (optimistic) ────────────────────────────────────────
  const logMutation = useMutation({
    mutationFn: ({
      food,
      qty,
      mealSplitId,
    }: {
      food: ParsedFood;
      qty: number;
      mealSplitId: string | null;
    }) => {
      if (!user) throw new Error("You must be logged in to log food.");
      return logFood(user.id, scaleFood(food, qty), mealSplitId);
    },

    onMutate: async ({ food, qty, mealSplitId }) => {
      if (!user) return;

      await queryClient.cancelQueries({ queryKey: ["todayLogs", user.id] });
      const snapshot = queryClient.getQueryData<FoodLogEntry[]>(["todayLogs", user.id]);

      const scaled = scaleFood(food, qty);
      const optimistic: FoodLogEntry = {
        id:            `opt-${Date.now()}`,
        user_id:       user.id,
        date:          new Date().toLocaleDateString("en-CA"),
        food_name:     scaled.name,
        calories:      scaled.calories,
        protein_g:     scaled.protein_g,
        carbs_g:       scaled.carbs_g,
        fat_g:         scaled.fat_g,
        iron_mg:       scaled.iron_mg,
        potassium_mg:  scaled.potassium_mg  || null,
        magnesium_mg:  scaled.magnesium_mg  || null,
        vitamin_c_mg:  scaled.vitamin_c_mg  || null,
        vitamin_d_mcg: scaled.vitamin_d_mcg || null,
        meal_split_id: mealSplitId,
      };

      queryClient.setQueryData<FoodLogEntry[]>(
        ["todayLogs", user.id],
        (old) => [...(old ?? []), optimistic],
      );

      setSelectedFood(null);
      return { snapshot };
    },

    onError: (err: Error, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["todayLogs", user?.id], context.snapshot);
      }
      toast.error(`Could not add food: ${err.message}`);
    },

    onSuccess: (_data, { food, qty }) => {
      void queryClient.invalidateQueries({ queryKey: ["todayLogs", user?.id] });
      const label = qty === 1 ? food.name : `${food.name} ×${qty}`;
      toast.success(`${label} added to today's log.`);
    },
  });

  // ── Log saved meal mutation ───────────────────────────────────────────────
  const logMealMutation = useLogMeal();

  function handleLogMeal(meal: SavedMealWithIngredients, mealSplitId: string | null) {
    if (!user) return;
    logMealMutation.mutate(
      { userId: user.id, meal, mealSplitId },
      {
        onSuccess: () => toast.success(`${meal.meal_name} added to today's log.`),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  const combinedResults = [...matchingCustomFoods, ...results];
  const customFoodIds = new Set(matchingCustomFoods.map((f) => f.foodId));

  const hasQuery        = !!debouncedQuery.trim();
  const hasResults      = combinedResults.length > 0;
  const showEmpty       = !isSearching && !hasResults && !searchError && hasQuery;
  const showHint        = !hasQuery;
  const showSavedMeals  = matchingSavedMeals.length > 0;

  return (
    <>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-6">

          {/* ── Header ── */}
          <header className="mb-5">
            <h1 className="text-2xl font-bold text-foreground">Track Food</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Search foods or pick a saved meal to log
            </p>
        </header>

          {/* ── Search input ── */}
          <div className="relative mb-3">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) { setResults([]); setSearchError(null); }
              }}
              placeholder="Apple, chicken breast, oats…"
              autoComplete="off"
              spellCheck={false}
              className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-shadow"
            />

            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => { setQuery(""); setResults([]); setSearchError(null); inputRef.current?.focus(); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── Create custom food button ── */}
          <button
            onClick={() => setCustomSheetOpen(true)}
            className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Create custom food
          </button>

          {/* ── Saved meals section ── */}
          {showSavedMeals && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {hasQuery ? `Saved meals matching "${debouncedQuery}"` : "Your saved meals"}
              </p>
              <div className="space-y-2.5">
                {matchingSavedMeals.map((meal) => (
                  <SavedMealCard
                    key={meal.id}
                    meal={meal}
                    mealSplits={mealSplits}
                    onLog={handleLogMeal}
                    isLogging={
                      logMealMutation.isPending &&
                      logMealMutation.variables?.meal.id === meal.id
                    }
                  />
                ))}
              </div>
          </div>
        )}

          {/* ── Divider when both saved meals and search results are shown ── */}
          {showSavedMeals && hasResults && hasQuery && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Food database results
                  </p>
                )}

          {/* ── Loading skeleton ── */}
          {isSearching && <ResultSkeleton />}

          {/* ── Error ── */}
          {searchError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
              {searchError}
                  </div>
          )}

          {/* ── USDA + Custom results ── */}
          {hasResults && !isSearching && (
                  <div>
              {!showSavedMeals || !hasQuery ? (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  {combinedResults.length} result{combinedResults.length !== 1 ? "s" : ""}
                  {matchingCustomFoods.length > 0 && (
                    <span className="ml-1 normal-case font-normal">
                      ({matchingCustomFoods.length} custom)
                    </span>
                  )}
                </p>
              ) : null}
              <div className="space-y-2.5">
                {combinedResults.map((food) => (
                  <ResultCard
                    key={food.foodId}
                    food={food}
                    onSelect={setSelectedFood}
                    isCustom={customFoodIds.has(food.foodId)}
                  />
                ))}
                  </div>
                </div>
          )}

          {/* ── Empty state after a search ── */}
          {showEmpty && !showSavedMeals && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-medium text-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Try a more general term</p>
                <button
                onClick={() => setCustomSheetOpen(true)}
                className="text-xs font-semibold text-primary underline underline-offset-2"
                >
                + Create a custom food instead
                </button>
              </div>
          )}

          {/* ── Hint before first search ── */}
          {showHint && !showSavedMeals && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-4">🥗</p>
              <p className="text-sm font-medium text-foreground">Start typing to search</p>
              <p className="text-xs text-muted-foreground mt-1">Results appear automatically as you type</p>
          </div>
        )}

          </div>
      </div>

      {/* ── Food Detail Sheet ── */}
      <FoodDetailSheet
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAdd={(food, qty, mealSplitId) => logMutation.mutate({ food, qty, mealSplitId })}
        isPending={logMutation.isPending}
        mealSplits={mealSplits}
      />

      {/* ── Custom Food Sheet ── */}
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
