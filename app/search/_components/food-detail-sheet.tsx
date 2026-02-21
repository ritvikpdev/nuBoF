"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import type { ParsedFood } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  food: ParsedFood | null;
  onClose: () => void;
  onAdd: (food: ParsedFood, qty: number) => void;
  isPending: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MACROS = [
  { label: "Protein", key: "protein_g"  as keyof ParsedFood, unit: "g",   color: "#3b82f6", kcalPerG: 4 },
  { label: "Carbs",   key: "carbs_g"    as keyof ParsedFood, unit: "g",   color: "#f97316", kcalPerG: 4 },
  { label: "Fat",     key: "fat_g"      as keyof ParsedFood, unit: "g",   color: "#f59e0b", kcalPerG: 9 },
] as const;

const MICROS = [
  { label: "Iron",      key: "iron_mg"       as keyof ParsedFood, unit: "mg",  icon: "🩸" },
  { label: "Potassium", key: "potassium_mg"  as keyof ParsedFood, unit: "mg",  icon: "🫘" },
  { label: "Magnesium", key: "magnesium_mg"  as keyof ParsedFood, unit: "mg",  icon: "✦"  },
  { label: "Vitamin C", key: "vitamin_c_mg"  as keyof ParsedFood, unit: "mg",  icon: "🍊" },
  { label: "Vitamin D", key: "vitamin_d_mcg" as keyof ParsedFood, unit: "mcg", icon: "☀️" },
] as const;

const PRESETS = [0.5, 1, 1.5, 2, 3];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scale(base: ParsedFood, qty: number) {
  return {
    calories:      Math.round(base.calories      * qty),
    protein_g:     +(base.protein_g     * qty).toFixed(1),
    carbs_g:       +(base.carbs_g       * qty).toFixed(1),
    fat_g:         +(base.fat_g         * qty).toFixed(1),
    iron_mg:       +(base.iron_mg       * qty).toFixed(2),
    potassium_mg:  +(base.potassium_mg  * qty).toFixed(1),
    magnesium_mg:  +(base.magnesium_mg  * qty).toFixed(1),
    vitamin_c_mg:  +(base.vitamin_c_mg  * qty).toFixed(1),
    vitamin_d_mcg: +(base.vitamin_d_mcg * qty).toFixed(1),
  };
}

function fmtQty(q: number): string {
  if (q === 0.5) return "½";
  if (q === 1.5) return "1½";
  if (Number.isInteger(q)) return String(q);
  return q.toFixed(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FoodDetailSheet({ food, onClose, onAdd, isPending }: Props) {
  const [qty, setQty] = useState(1);

  // Reset qty each time a new food is opened (synchronising derived state with a prop is unavoidable here)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (food) setQty(1); }, [food]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const nutrients = useMemo(
    () => (food ? scale(food, qty) : null),
    [food, qty],
  );

  function stepQty(delta: number) {
    setQty((q) => +(Math.min(10, Math.max(0.5, q + delta)).toFixed(1)));
  }

  return (
    <AnimatePresence>
      {food && nutrients && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* ── Sheet ─────────────────────────────────────────────────────── */}
          {/*  Mobile:  full-width, slides up from bottom                     */}
          {/*  Desktop: constrained to 440px, centred on the page             */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-card rounded-t-3xl max-h-[92vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-[440px] sm:rounded-2xl sm:bottom-8 sm:shadow-2xl"
            role="dialog"
            aria-modal
            aria-label={food.name}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">

              {/* Food name */}
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary mb-1">
                Nutrition info
              </p>
              <h2 className="text-xl font-bold text-foreground mb-1 pr-8 leading-snug">
                {food.name}
              </h2>
              {food.servingSize && (
                <p className="text-xs text-muted-foreground mb-4">
                  Per {food.servingSize}{food.servingSizeUnit ? ` ${food.servingSizeUnit}` : "g"} (1 serving)
                </p>
              )}

              {/* ── Calories ── */}
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-5xl font-bold tabular-nums text-foreground leading-none">
                  {nutrients.calories.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground font-medium">kcal</span>
              </div>

              {/* ── Quantity adjuster ── */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Servings
                </p>

                {/* Preset chips */}
                <div className="flex gap-2 mb-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setQty(p)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        qty === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {fmtQty(p)}
                    </button>
                  ))}
                </div>

                {/* Fine stepper */}
                <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
                  <button
                    onClick={() => stepQty(-0.5)}
                    disabled={qty <= 0.5}
                    className="flex-1 py-2.5 rounded-lg text-xl font-bold text-foreground disabled:opacity-30 hover:bg-background/60 transition-colors"
                    aria-label="Decrease serving"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {fmtQty(qty)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {qty === 1 ? "serving" : "servings"}
                    </span>
                  </div>
                  <button
                    onClick={() => stepQty(0.5)}
                    disabled={qty >= 10}
                    className="flex-1 py-2.5 rounded-lg text-xl font-bold text-foreground disabled:opacity-30 hover:bg-background/60 transition-colors"
                    aria-label="Increase serving"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── Macros ── */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {MACROS.map(({ label, key, unit, color, kcalPerG }) => {
                  const val = nutrients[key as keyof typeof nutrients] as number;
                  return (
                    <div
                      key={label}
                      className="bg-muted/60 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground tabular-nums leading-none mb-0.5">
                        {val}{unit}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(val * kcalPerG)} kcal
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ── Micronutrients ── */}
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Micronutrients
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {MICROS.map(({ label, key, unit, icon }) => {
                    const val = nutrients[key as keyof typeof nutrients] as number;
                    return (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm leading-none">{icon}</span>
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {val.toFixed(1)}{unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ── Sticky Add button ── */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-card">
              <button
                onClick={() => onAdd(food, qty)}
                disabled={isPending}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-base transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Adding…
                  </span>
                ) : (
                  `Add ${fmtQty(qty)} serving${qty !== 1 ? "s" : ""} to Log`
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
