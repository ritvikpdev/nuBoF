"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { getMeasures, getPresets } from "@/lib/food-measures";
import { MACRO_COLORS } from "@/lib/constants";
import { scaleFood } from "@/services/nutrition";
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

const DETAIL_LABELS: Record<string, string> = {
  protein_g: "Protein", carbs_g: "Carbs", fat_g: "Fat", fiber_g: "Fiber",
};

const MACROS = MACRO_COLORS.map((m) => ({
  label: DETAIL_LABELS[m.key] ?? m.label,
  key: m.key as keyof ParsedFood,
  unit: "g",
  color: m.hex,
  kcalPerG: m.kcalPerG,
}));

const MICROS = [
  { label: "Iron",      key: "iron_mg"       as keyof ParsedFood, unit: "mg",  icon: "🩸" },
  { label: "Potassium", key: "potassium_mg"  as keyof ParsedFood, unit: "mg",  icon: "🫘" },
  { label: "Magnesium", key: "magnesium_mg"  as keyof ParsedFood, unit: "mg",  icon: "✦"  },
  { label: "Vitamin C", key: "vitamin_c_mg"  as keyof ParsedFood, unit: "mg",  icon: "🍊" },
  { label: "Vitamin D", key: "vitamin_d_mcg" as keyof ParsedFood, unit: "mcg", icon: "☀️" },
] as const;

// 0.25 → 2000 in sensible intervals
function buildQtyOptions(): number[] {
  const opts: number[] = [];
  for (let v = 0.25; v <= 2;    v = +(v + 0.25).toFixed(2)) opts.push(v);
  for (let v = 2.5;  v <= 5;    v = +(v + 0.5).toFixed(1))  opts.push(v);
  for (let v = 6;    v <= 20;   v++)                          opts.push(v);
  for (let v = 25;   v <= 100;  v += 5)                       opts.push(v);
  for (let v = 110;  v <= 300;  v += 10)                      opts.push(v);
  for (let v = 325;  v <= 500;  v += 25)                      opts.push(v);
  for (let v = 550;  v <= 1000; v += 50)                      opts.push(v);
  for (let v = 1100; v <= 2000; v += 100)                     opts.push(v);
  return opts;
}

const QTY_OPTIONS = buildQtyOptions();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (Number.isInteger(n)) return String(n);
  return n % 1 === 0.5 ? `${Math.floor(n)}½` : n.toFixed(2).replace(/\.?0+$/, "");
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
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
  const [quantity,        setQuantity]       = useState(1);
  const [measureIdx,      setMeasureIdx]     = useState(0);
  const [qtyInputValue,   setQtyInputValue]  = useState("1");
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(defaultSplitId ?? null);
  const [qtyOpen,         setQtyOpen]        = useState(false);

  const quickPickRef = useRef<HTMLDivElement>(null);

  // Scroll the highlighted option into view when the list opens
  useEffect(() => {
    if (!qtyOpen || !quickPickRef.current) return;
    const active = quickPickRef.current.querySelector("[data-active=true]") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest" });
  }, [qtyOpen]);

  // Reset when food changes
  useEffect(() => {
    if (food) {
      setQuantity(1);
      setQtyInputValue("1");
      setMeasureIdx(0);
      setSelectedSplitId(defaultSplitId ?? null);
      setQtyOpen(false);
    }
  }, [food, defaultSplitId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (qtyOpen) setQtyOpen(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, qtyOpen]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const measures   = useMemo(() => (food ? getMeasures(food) : []), [food]);
  const measure    = measures[measureIdx] ?? measures[0];
  const presets    = useMemo(() => (measure ? getPresets(measure) : []), [measure]);

  const netWeight  = useMemo(
    () => Math.round(quantity * (measure?.gramsPerUnit ?? 1) * 10) / 10,
    [quantity, measure],
  );

  const scaleFactor = useMemo(() => {
    if (!food || !measure) return 1;
    return (quantity * measure.gramsPerUnit) / (food.servingSize ?? 100);
  }, [food, measure, quantity]);

  const nutrients  = useMemo(
    () => (food ? scaleFood(food, scaleFactor) : null),
    [food, scaleFactor],
  );

  const addLabel   = useMemo(() => {
    if (!measure) return "Add to Log";
    const splitName = selectedSplitId
      ? mealSplits.find((s) => s.id === selectedSplitId)?.name
      : null;
    return `Add ${fmtNum(quantity)} ${measure.label} ${splitName ? `to ${splitName}` : "to Log"}`;
  }, [quantity, measure, selectedSplitId, mealSplits]);

  // ── Qty helpers ─────────────────────────────────────────────────────────────

  function commitQty(raw: string) {
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      const clamped = clamp(n, 0.25, 2000);
      setQuantity(clamped);
      setQtyInputValue(String(clamped));
    }
  }

  function step(delta: number) {
    const next = clamp(+(quantity + delta).toFixed(2), 0.25, 2000);
    setQuantity(next);
    setQtyInputValue(String(next));
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {food && nutrients && (
        <>
          {/* Backdrop */}
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

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-card rounded-t-3xl max-h-[92vh]
                       sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-[440px]
                       sm:rounded-2xl sm:bottom-8 sm:shadow-2xl"
            role="dialog"
            aria-modal
            aria-label={food.name}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">

              {/* Header */}
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

              {/* ── Amount ── */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Amount
                </p>

                {/* Preset chips */}
                {presets.length > 0 && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {presets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setQuantity(p); setQtyInputValue(String(p)); setQtyOpen(false); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                          quantity === p
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {fmtNum(p)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Qty stepper + measure */}
                <div className="flex gap-2 items-stretch">
                  {/* Stepper: − | input | + */}
                  <div className="flex items-stretch rounded-xl border border-input bg-background overflow-hidden flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => step(-0.25)}
                      className="px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold text-base cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0.25}
                      max={2000}
                      step={0.25}
                      value={qtyInputValue}
                      onChange={(e) => {
                        setQtyInputValue(e.target.value);
                        const n = parseFloat(e.target.value);
                        if (!isNaN(n) && n >= 0.25 && n <= 2000) setQuantity(n);
                      }}
                      onBlur={(e) => commitQty(e.target.value)}
                      className="w-14 py-2.5 text-sm font-bold text-center text-foreground bg-transparent border-x border-input focus:outline-none
                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      onClick={() => step(1)}
                      className="px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold text-base cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Measure select */}
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

                {/* Quick-pick toggle */}
                <button
                  type="button"
                  onClick={() => setQtyOpen((o) => !o)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  aria-expanded={qtyOpen}
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${qtyOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12" fill="none" aria-hidden
                  >
                    <path d="M2 4.5l4 3.5 4-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {qtyOpen ? "Hide quick pick" : "Quick pick"}
                </button>

                {/* Inline quick-pick list — no fixed positioning, no coordinate math */}
                <AnimatePresence initial={false}>
                  {qtyOpen && (
                    <motion.div
                      key="quickpick"
                      ref={quickPickRef}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-background">
                        {QTY_OPTIONS.map((v) => (
                          <button
                            key={v}
                            type="button"
                            data-active={quantity === v}
                            onClick={() => {
                              setQuantity(v);
                              setQtyInputValue(String(v));
                              setQtyOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-sm text-left transition-colors cursor-pointer ${
                              quantity === v
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            {fmtNum(v)}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        type="button"
                        onClick={() => setSelectedSplitId((prev) => prev === split.id ? null : split.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
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
              <div className="grid grid-cols-2 gap-3 mb-5">
                {MACROS.map(({ label, key, unit, color, kcalPerG }) => {
                  const raw = nutrients[key as keyof typeof nutrients];
                  if (raw === undefined) return null;
                  const val = raw as number;
                  return (
                    <div key={label} className="bg-muted/60 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground tabular-nums leading-none mb-0.5">
                        {val}{unit}
                      </p>
                      {kcalPerG > 0 && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(val * kcalPerG)} kcal
                        </p>
                      )}
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

            {/* ── Sticky add button ── */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-card">
              <button
                onClick={() => onAdd(food, scaleFactor, selectedSplitId)}
                disabled={isPending}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-base transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed"
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
