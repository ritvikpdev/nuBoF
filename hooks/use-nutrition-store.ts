"use client";

import { create } from "zustand";
import { ZERO_TOTALS } from "@/lib/constants";
import type { DailyGoals, DailyTotals, ParsedFood } from "@/types";

interface NutritionState {
  goals: DailyGoals | null;
  totals: DailyTotals;
  recentSearchResults: ParsedFood[];

  setGoals: (goals: DailyGoals | null) => void;
  setTotals: (totals: DailyTotals) => void;
  setRecentSearchResults: (results: ParsedFood[]) => void;
  reset: () => void;
}

/**
 * Zustand store for ephemeral client-side nutrition state.
 * Use for optimistic updates and cross-component search results.
 * Persistent server state should live in React Query (useNutrition hooks).
 */
export const useNutritionStore = create<NutritionState>((set) => ({
  goals: null,
  totals: { ...ZERO_TOTALS },
  recentSearchResults: [],

  setGoals: (goals) => set({ goals }),
  setTotals: (totals) => set({ totals }),
  setRecentSearchResults: (results) => set({ recentSearchResults: results }),
  reset: () => set({ goals: null, totals: { ...ZERO_TOTALS }, recentSearchResults: [] }),
}));
