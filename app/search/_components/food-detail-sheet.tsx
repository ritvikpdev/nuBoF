"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { getMeasures, getPresets } from "@/lib/food-measures";
import type { ParsedFood, MealSplit } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  food: ParsedFood | null;
  onClose: () => void;
  onAdd: (food: ParsedFood, scaleFactor: number, mealSplitId: string | null) => void;
  isPending: boolean;
  mealSplits?: MealSplit[];
  defaultSplitId?: string | null;
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

// Dropdown range: 0.25 – 2000 with sensible step intervals
function buildQtyOptions(): number[] {
  const opts: number[] = [];
  // 0.25 → 2 in 0.25 steps
  for (let v = 0.25; v <= 2; v = +(v + 0.25).toFixed(2)) opts.push(v);
  // 2.5 → 5 in 0.5 steps
  for (let v = 2.5; v <= 5; v = +(v + 0.5).toFixed(1)) opts.push(v);
  // 6 → 20 in 1 step
  for (let v = 6; v <= 20; v++) opts.push(v);
  // 25 → 100 in 5 steps
  for (let v = 25; v <= 100; v += 5) opts.push(v);
  // 110 → 300 in 10 steps
  for (let v = 110; v <= 300; v += 10) opts.push(v);
  // 325 → 500 in 25 steps
  for (let v = 325; v <= 500; v += 25) opts.push(v);
  // 550 → 1000 in 50 steps
  for (let v = 550; v <= 1000; v += 50) opts.push(v);
  // 1100 → 2000 in 100 steps
  for (let v = 1100; v <= 2000; v += 100) opts.push(v);
  return opts;
}

const QTY_OPTIONS = buildQtyOptions();

// ─── Scale helper ──────────────────────────────────────────────────────────────

function scaleNutrients(base: ParsedFood, factor: number) {
  return {
    calories:      Math.round(base.calories      * factor),
    protein_g:     +(base.protein_g     * factor).toFixed(1),
    carbs_g:       +(base.carbs_g       * factor).toFixed(1),
    fat_g:         +(base.fat_g         * factor).toFixed(1),
    iron_mg:       +(base.iron_mg       * factor).toFixed(2),
    potassium_mg:  +(base.potassium_mg  * factor).toFixed(1),
    magnesium_mg:  +(base.magnesium_mg  * factor).toFixed(1),
    vitamin_c_mg:  +(base.vitamin_c_mg  * factor).toFixed(1),
    vitamin_d_mcg: +(base.vitamin_d_mcg * factor).toFixed(1),
  };
}

function fmtNum(n: number) {
  if (Number.isInteger(n)) return String(n);
  return n % 1 === 0.5 ? `${Math.floor(n)}½` : n.toFixed(2).replace(/\.?0+$/, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FoodDetailSheet({
  food,
  onClose,
  onAdd,
  isPending,
  mealSplits = [],
  defaultSplitId,
}: Props) {
  const [quantity,       setQuantity]      = useState(1);
  const [measureIdx,     setMeasureIdx]    = useState(0);
  const [qtyInputValue,  setQtyInputValue] = useState("1");
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(
    defaultSplitId ?? null,
  );

  // Reset state when food changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (food) {
      setQuantity(1);
      setQtyInputValue("1");
      setMeasureIdx(0);
      setSelectedSplitId(defaultSplitId ?? null);
    }
  }, [food, defaultSplitId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Measures are derived from the food type
  const measures = useMemo(() => (food ? getMeasures(food) : []), [food]);
  const measure  = measures[measureIdx] ?? measures[0];

  // Net weight in grams / ml
  const netWeight = useMemo(
    () => Math.round(quantity * (measure?.gramsPerUnit ?? 1) * 10) / 10,
    [quantity, measure],
  );

  // Scale factor relative to serving size
  const scaleFactor = useMemo(() => {
    if (!food || !measure) return 1;
    const serving = food.servingSize ?? 100;
    return (quantity * measure.gramsPerUnit) / serving;
  }, [food, measure, quantity]);

  const nutrients = useMemo(
    () => (food ? scaleNutrients(food, scaleFactor) : null),
    [food, scaleFactor],
  );

  const presets = useMemo(() => (measure ? getPresets(measure) : []), [measure]);

  // Qty input helpers
  function applyQty(raw: string) {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= 0.25 && n <= 2000) {
      setQuantity(n);
    }
  }

  // Button label for the add action
  const addLabel = useMemo(() => {
    if (!measure) return "Add to Log";
    const splitName = selectedSplitId
      ? mealSplits.find((s) => s.id === selectedSplitId)?.name
      : null;
    const dest = splitName ? `to ${splitName}` : "to Log";
    return `Add ${fmtNum(quantity)} ${measure.label} ${dest}`;
  }, [quantity, measure, selectedSplitId, mealSplits]);

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

          {/* ── Sheet ── */}
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

              {/* Food header */}
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

              {/* Calories */}
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-5xl font-bold tabular-nums text-foreground leading-none">
                  {nutrients.calories.toLocaleString()}
                </span>
                <span className="text-lg text-muted-foreground font-medium">kcal</span>
              </div>

              {/* ── Quantity + Measure ── */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Amount
                </p>

                {/* Preset chips */}
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setQuantity(p);
                        setQtyInputValue(String(p));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        quantity === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {fmtNum(p)}
                    </button>
                  ))}
                </div>

                {/* Quantity + Measure row */}
                <div className="flex gap-2">
                  {/* Quantity input + dropdown */}
                  <div className="flex rounded-xl border border-input bg-background overflow-hidden flex-shrink-0">
                    {/* Editable number */}
                    <input
                      type="number"
                      min={0.25}
                      max={2000}
                      step={0.25}
                      value={qtyInputValue}
                      onChange={(e) => {
                        setQtyInputValue(e.target.value);
                        applyQty(e.target.value);
                      }}
                      onBlur={() => {
                        const n = parseFloat(qtyInputValue);
                        if (isNaN(n) || n < 0.25) {
                          setQuantity(0.25);
                          setQtyInputValue("0.25");
                        } else if (n > 2000) {
                          setQuantity(2000);
                          setQtyInputValue("2000");
                        }
                      }}
                      className="w-16 px-2 py-2.5 text-sm font-bold text-center text-foreground bg-transparent border-r border-input focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Quantity"
                    />
                    {/* Dropdown select for presets */}
                    <select
                      value={quantity}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setQuantity(v);
                        setQtyInputValue(String(v));
                      }}
                      className="px-1 py-2.5 text-xs text-muted-foreground bg-transparent focus:outline-none cursor-pointer"
                      aria-label="Quick pick quantity"
                    >
                      {QTY_OPTIONS.map((v) => (
                        <option key={v} value={v}>{fmtNum(v)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Measure dropdown */}
                  <select
                    value={measureIdx}
                    onChange={(e) => setMeasureIdx(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    aria-label="Unit of measure"
                  >
                    {measures.map((m, i) => (
                      <option key={i} value={i}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Net weight */}
                <p className="text-xs text-muted-foreground mt-2">
                  ≈ <span className="font-semibold text-foreground">{netWeight}</span>{" "}
                  {measure?.label === "ml" || measure?.presetType === "volume" ? "ml" : "g"}
                </p>
              </div>

              {/* ── Meal selector ── */}
              {mealSplits.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Add to meal
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mealSplits.map((split) => (
                      <button
                        key={split.id}
                        onClick={() =>
                          setSelectedSplitId((prev) => prev === split.id ? null : split.id)
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
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
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      No meal selected — will be logged as uncategorized
                    </p>
                  )}
                </div>
              )}

              {/* ── Macros ── */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {MACROS.map(({ label, key, unit, color, kcalPerG }) => {
                  const val = nutrients[key as keyof typeof nutrients] as number;
                  return (
                    <div key={label} className="bg-muted/60 rounded-xl p-3">
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
                onClick={() => onAdd(food, scaleFactor, selectedSplitId)}
                disabled={isPending}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-base transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Adding…
                  </span>
                ) : addLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
