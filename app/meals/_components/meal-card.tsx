"use client";

import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import type { SavedMealWithIngredients } from "@/hooks/use-meals";

interface Props {
  meal: SavedMealWithIngredients;
  onLog: (meal: SavedMealWithIngredients) => void;
  onDelete: (mealId: string) => void;
  isLogging: boolean;
  isDeleting: boolean;
}

const MACRO_COLS = [
  { label: "P", valueKey: "total_protein_g" as const, color: "text-blue-500"   },
  { label: "C", valueKey: "total_carbs_g"   as const, color: "text-orange-500" },
  { label: "F", valueKey: "total_fat_g"     as const, color: "text-amber-500"  },
];


export function MealCard({ meal, onLog, onDelete, isLogging, isDeleting }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -1 }}
      className="group bg-card rounded-2xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Emerald top stripe */}
      <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />

      <div className="p-4 pt-3.5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-snug truncate">{meal.meal_name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {meal.meal_ingredients.length} ingredient{meal.meal_ingredients.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Delete */}
          <button
            onClick={() => meal.id && onDelete(meal.id)}
            disabled={isDeleting || isLogging}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
            aria-label={`Delete ${meal.meal_name}`}
          >
            {isDeleting ? (
              <Spinner />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6.5 2h3M2 4h12m-1.5 0L11 13H5L3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Nutrition summary ── */}
        <div className="flex items-center gap-3 mb-3.5 p-3 bg-muted/50 rounded-xl">
          <div>
            <span className="text-2xl font-bold text-foreground tabular-nums leading-none">
              {meal.total_calories.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">kcal</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {MACRO_COLS.map(({ label, valueKey, color }) => (
              <span key={label} className="text-xs text-muted-foreground tabular-nums">
                <span className={`font-bold ${color}`}>{label}</span>{" "}
                {Math.round(meal[valueKey])}g
              </span>
            ))}
          </div>
        </div>

        {/* ── Ingredient pills ── */}
        {meal.meal_ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {meal.meal_ingredients.slice(0, 4).map((ing, i) => (
              <span
                key={ing.id ?? i}
                className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full truncate max-w-[11rem]"
              >
                {ing.food_name}
              </span>
            ))}
            {meal.meal_ingredients.length > 4 && (
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                +{meal.meal_ingredients.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        <button
          onClick={() => onLog(meal)}
          disabled={isLogging || isDeleting}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none shadow-sm"
        >
          {isLogging ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Adding to log…
            </span>
          ) : (
            "+ Add to Today's Log"
          )}
        </button>
      </div>
    </motion.div>
  );
}
