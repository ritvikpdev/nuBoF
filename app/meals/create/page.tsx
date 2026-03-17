"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/use-debounce";
import { useCreateMeal } from "@/hooks/use-meals";
import type { DraftIngredient } from "@/hooks/use-meals";
import { useCustomFoods } from "@/hooks/use-custom-foods";
import { searchFoods } from "@/services/nutrition";
import { toCustomParsedFood } from "@/services/custom-foods";
import type { ParsedFood } from "@/types";
import { FoodDetailSheet } from "@/app/search/_components/food-detail-sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type BuilderStage = "list" | "search";

// ─── Running totals helper ────────────────────────────────────────────────────

function calcTotals(ingredients: DraftIngredient[]) {
  return ingredients.reduce(
    (acc, { food, qty }) => ({
      calories:  acc.calories  + food.calories  * qty,
      protein_g: acc.protein_g + food.protein_g * qty,
      carbs_g:   acc.carbs_g   + food.carbs_g   * qty,
      fat_g:     acc.fat_g     + food.fat_g     * qty,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

// ─── Search result skeleton ───────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-xl border border-border p-3.5 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="flex gap-4">
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateMealPage() {
  const router = useRouter();
  const { user } = useUser();
  const createMealMutation = useCreateMeal();
  const { data: customFoods = [] } = useCustomFoods(user?.id);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [mealName, setMealName]       = useState("");
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  // ── Builder navigation ──────────────────────────────────────────────────────
  const [stage, setStage]             = useState<BuilderStage>("list");
  const [selectedFood, setSelectedFood] = useState<ParsedFood | null>(null);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<ParsedFood[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [searchError, setSearchError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 480);

  // ── Focus search input when switching to search stage ───────────────────────
  useEffect(() => {
    if (stage === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [stage]);

  // ── Auto-search on debounced query ───────────────────────────────────────────
  // Empty-query state is reset directly in the onChange handler below so this
  // effect only needs to handle the non-empty (actual search) case.
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Reset loading state before each new request (setState-in-effect is intentional here)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    searchFoods(trimmed, controller.signal)
      .then((foods) => {
        setSearchResults(foods);
        if (foods.length === 0) setSearchError("No results. Try a different term.");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setSearchError(err.message ?? "Search failed.");
      })
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  // ── Custom foods matching the search query ───────────────────────────────────
  const matchingCustomFoods = useMemo<ParsedFood[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return customFoods
      .filter((f) => f.name.toLowerCase().includes(q))
      .map(toCustomParsedFood);
  }, [debouncedQuery, customFoods]);

  const combinedSearchResults = useMemo(
    () => [...matchingCustomFoods, ...searchResults],
    [matchingCustomFoods, searchResults],
  );
  const customFoodIds = useMemo(
    () => new Set(matchingCustomFoods.map((f) => f.foodId)),
    [matchingCustomFoods],
  );

  // ── Totals (live) ────────────────────────────────────────────────────────────
  const totals = useMemo(() => calcTotals(ingredients), [ingredients]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleAddIngredient(food: ParsedFood, qty: number, _mealSplitId?: string | null) {
    setIngredients((prev) => [
      ...prev,
      { draftId: crypto.randomUUID(), food, qty },
    ]);
    setSelectedFood(null);
    // Reset search so the user can immediately search for the next ingredient
    setSearchQuery("");
    setSearchResults([]);
    setStage("list");
    toast.success(`${food.name} added.`);
  }

  function handleRemoveIngredient(draftId: string) {
    setIngredients((prev) => prev.filter((i) => i.draftId !== draftId));
  }

  async function handleSave() {
    if (!user) { toast.error("Not logged in."); return; }
    if (!mealName.trim()) { toast.error("Give your meal a name first."); return; }
    if (ingredients.length === 0) { toast.error("Add at least one ingredient."); return; }

    createMealMutation.mutate(
      { userId: user.id, name: mealName, ingredients },
      {
        onSuccess: () => {
          toast.success(`"${mealName.trim()}" saved!`);
          router.push("/meals");
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  const canSave = mealName.trim().length > 0 && ingredients.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem)] bg-muted/30 pb-32">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-6">

          {/* ── Top bar ── */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => stage === "search" ? setStage("list") : router.back()}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {stage === "search" ? "Back" : "Meals"}
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {stage === "search" ? "Find Ingredient" : "Create Meal"}
            </h1>
          </div>

          <AnimatePresence mode="wait" initial={false}>

            {/* ════════════════════════════════════════
                STAGE: list  — meal name + ingredients
               ════════════════════════════════════════ */}
            {stage === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                {/* Meal name */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Meal Name
                  </label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g. Post-workout bowl"
                    className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  />
                </div>

                {/* ── Ingredients section ── */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Ingredients {ingredients.length > 0 && `(${ingredients.length})`}
                    </p>
                    <button
                      onClick={() => setStage("search")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      Add Ingredient
                    </button>
                  </div>

                  {ingredients.length === 0 ? (
                    <button
                      onClick={() => setStage("search")}
                      className="w-full py-8 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      + Tap to add your first ingredient
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {ingredients.map(({ draftId, food, qty }) => {
                          const kcal = Math.round(food.calories * qty);
                          return (
                            <motion.div
                              key={draftId}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.18 }}
                              className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {food.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {qty === 1 ? "1 serving" : `${qty} servings`}
                                  {" · "}
                                  <span className="tabular-nums">{kcal} kcal</span>
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveIngredient(draftId)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0"
                                aria-label={`Remove ${food.name}`}
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* ── Running totals ── */}
                {ingredients.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary mb-2">
                      Meal Totals
                    </p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-foreground tabular-nums leading-none">
                        {Math.round(totals.calories).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">kcal</span>
                    </div>
                    <div className="flex gap-5 text-sm">
                      {[
                        { label: "Protein", value: totals.protein_g, color: "text-blue-500"   },
                        { label: "Carbs",   value: totals.carbs_g,   color: "text-orange-500" },
                        { label: "Fat",     value: totals.fat_g,     color: "text-amber-500"  },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <span className={`text-xs font-semibold ${color}`}>{label}</span>
                          <p className="font-semibold text-foreground tabular-nums text-sm">
                            {Math.round(value)}g
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════════
                STAGE: search — find foods to add
               ════════════════════════════════════════ */}
            {stage === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
              >
                {/* Search input */}
                <div className="relative mb-4">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    viewBox="0 0 16 16" fill="none" aria-hidden
                  >
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (!val.trim()) { setSearchResults([]); setSearchError(null); }
                    }}
                    placeholder="Apple, oats, chicken breast…"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        onClick={() => { setSearchQuery(""); setSearchResults([]); searchInputRef.current?.focus(); }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Results */}
                {isSearching && <SearchSkeleton />}

                {searchError && !isSearching && (
                  <p className="text-sm text-muted-foreground text-center py-8">{searchError}</p>
                )}

                {!isSearching && combinedSearchResults.length > 0 && (
                  <div className="space-y-2">
                    {combinedSearchResults.map((food) => (
                      <motion.button
                        key={food.foodId}
                        type="button"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFood(food)}
                        className="w-full text-left bg-card rounded-xl border border-border hover:border-primary/40 transition-colors p-3.5 group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-foreground leading-snug truncate">
                                {food.name}
                              </p>
                              {customFoodIds.has(food.foodId) && (
                                <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="flex gap-3 mt-0.5">
                              <span className="text-xs font-bold text-foreground tabular-nums">
                                {food.calories} <span className="font-normal text-muted-foreground">kcal</span>
                              </span>
                              {[
                                { l: "P", v: food.protein_g, c: "text-blue-500"   },
                                { l: "C", v: food.carbs_g,   c: "text-orange-500" },
                                { l: "F", v: food.fat_g,     c: "text-amber-500"  },
                              ].map(({ l, v, c }) => (
                                <span key={l} className="text-xs text-muted-foreground tabular-nums">
                                  <span className={`font-semibold ${c}`}>{l}</span> {Math.round(v)}g
                                </span>
                              ))}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
                            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {!isSearching && !searchError && combinedSearchResults.length === 0 && !debouncedQuery.trim() && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-3xl mb-3">🔍</p>
                    <p className="text-sm">Start typing to search the food database</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Sticky save button (list stage only) ── */}
      {stage === "list" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t border-border">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSave}
              disabled={!canSave || createMealMutation.isPending}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-foreground font-semibold text-base transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {createMealMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Saving…
                </span>
              ) : (
                "Save Meal"
              )}
            </button>
            {!canSave && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {!mealName.trim() ? "Enter a meal name" : "Add at least one ingredient"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Food detail sheet (reused from search page) ── */}
      <FoodDetailSheet
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAdd={handleAddIngredient}
        isPending={false}
      />
    </>
  );
}
