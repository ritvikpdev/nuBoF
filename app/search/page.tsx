"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/use-debounce";
import { searchFoods, logFood, scaleFood } from "@/services/nutrition";
import type { ParsedFood, FoodLogEntry } from "@/types";
import { FoodDetailSheet } from "./_components/food-detail-sheet";

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
}: {
  food: ParsedFood;
  onSelect: (food: ParsedFood) => void;
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
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {food.name}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-bold text-foreground tabular-nums">
              {food.calories} <span className="font-normal text-muted-foreground">kcal</span>
            </span>
            {macros.map(({ label, value, color }) => (
              <span key={label} className="text-xs text-muted-foreground tabular-nums">
                <span className={`font-semibold ${color}`}>{label}</span>{" "}
                {Math.round(value)}g
              </span>
            ))}
          </div>
        </div>
        {/* Chevron */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParsedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<ParsedFood | null>(null);

  const debouncedQuery = useDebounce(query, 480);

  // ── Auto-focus input on mount ──────────────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Fire search whenever the debounced query changes ──────────────────────
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
    setSearchError(null);
    setIsSearching(true);
    setResults([]);

    searchFoods(trimmed, controller.signal)
      .then((foods) => {
        setResults(foods);
        if (foods.length === 0) setSearchError("No results. Try a different term.");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setSearchError(err.message ?? "Search failed. Please try again.");
      })
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  // ── Log mutation (optimistic) ─────────────────────────────────────────────
  const logMutation = useMutation({
    mutationFn: ({ food, qty }: { food: ParsedFood; qty: number }) => {
      if (!user) throw new Error("You must be logged in to log food.");
      return logFood(user.id, scaleFood(food, qty));
    },

    // ① Close the sheet and inject an optimistic entry before the server responds.
    //   This makes the app feel instant — the dashboard total updates in <1 frame.
    onMutate: async ({ food, qty }) => {
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
      };

      queryClient.setQueryData<FoodLogEntry[]>(
        ["todayLogs", user.id],
        (old) => [...(old ?? []), optimistic],
      );

      setSelectedFood(null); // close sheet immediately

      return { snapshot };
    },

    // ② On server error: restore the snapshot and notify.
    onError: (err: Error, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["todayLogs", user?.id], context.snapshot);
      }
      toast.error(`Could not add food: ${err.message}`);
    },

    // ③ On server success: swap the optimistic entry for the real one.
    onSuccess: (_data, { food, qty }) => {
      void queryClient.invalidateQueries({ queryKey: ["todayLogs", user?.id] });
      const label = qty === 1 ? food.name : `${food.name} ×${qty}`;
      toast.success(`${label} added to today's log.`);
    },
  });

  const hasResults = results.length > 0;
  const showEmpty  = !isSearching && !hasResults && !searchError && !!debouncedQuery.trim();
  const showHint   = !isSearching && !hasResults && !searchError && !debouncedQuery.trim();

  return (
    <>
      <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-6">

          {/* ── Header ── */}
          <header className="mb-5">
            <h1 className="text-2xl font-bold text-foreground">Search Foods</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Tap any result to adjust serving size before logging
            </p>
          </header>

          {/* ── Search input ── */}
          <div className="relative mb-5">
            {/* Search icon */}
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

            {/* Clear button */}
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

          {/* ── Loading skeleton ── */}
          {isSearching && <ResultSkeleton />}

          {/* ── Error ── */}
          {searchError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
              {searchError}
            </div>
          )}

          {/* ── Results ── */}
          {hasResults && !isSearching && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2.5">
                {results.map((food) => (
                  <ResultCard
                    key={food.foodId}
                    food={food}
                    onSelect={setSelectedFood}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state after a search ── */}
          {showEmpty && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-medium text-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
              <p className="text-xs text-muted-foreground mt-1">Try a more general term</p>
            </div>
          )}

          {/* ── Hint before first search ── */}
          {showHint && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-4">🥗</p>
              <p className="text-sm font-medium text-foreground">Start typing to search</p>
              <p className="text-xs text-muted-foreground mt-1">Results appear automatically as you type</p>
            </div>
          )}

        </div>
      </div>

      {/* ── Food Detail Sheet (portal-like fixed overlay) ── */}
      <FoodDetailSheet
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAdd={(food, qty) => logMutation.mutate({ food, qty })}
        isPending={logMutation.isPending}
      />
    </>
  );
}
