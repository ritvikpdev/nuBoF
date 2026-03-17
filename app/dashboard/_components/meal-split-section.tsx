"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import type { FoodLogEntry, MealSplit, DailyGoals } from "@/types";

interface Props {
  split: MealSplit;
  logs: FoodLogEntry[];
  goals: DailyGoals;
  onDelete: (logId: string) => void;
  deletingId?: string;
}

const MACROS = [
  { key: "protein_g" as const, label: "P", color: "text-blue-500"   },
  { key: "carbs_g"   as const, label: "C", color: "text-orange-500" },
  { key: "fat_g"     as const, label: "F", color: "text-amber-500"  },
];

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.5 2h3M2 4h12m-1.5 0L11 13H5L3.5 4"
        stroke="currentColor" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className="w-4 h-4 text-muted-foreground"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/** A single color per split — cycles through a small palette by display_order. */
const SPLIT_COLORS = [
  { bar: "from-orange-400 to-amber-300",    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { bar: "from-primary to-emerald-400",     badge: "bg-primary/10 text-primary" },
  { bar: "from-blue-500 to-sky-400",        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { bar: "from-violet-500 to-purple-400",   badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
];

function getColor(order: number) {
  return SPLIT_COLORS[order % SPLIT_COLORS.length];
}

export function MealSplitSection({ split, logs, goals, onDelete, deletingId }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const targetCalories = Math.round((split.percentage / 100) * goals.target_calories);
  const consumedCalories = logs.reduce((s, l) => s + Number(l.calories ?? 0), 0);
  const pct = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;
  const color = getColor(split.display_order);

  const caloriesLeft = targetCalories - consumedCalories;
  const isOver = consumedCalories > targetCalories;

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Colored top accent stripe */}
      <div className={`h-1 bg-gradient-to-r ${color.bar}`} />

      <div className="p-4">
        {/* ── Header ── */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 mb-3"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-sm text-foreground truncate">{split.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color.badge}`}>
              {split.percentage}%
            </span>
            {logs.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {logs.length} item{logs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-bold tabular-nums text-foreground">
              {Math.round(consumedCalories).toLocaleString()}
              <span className="text-muted-foreground font-normal text-xs"> / {targetCalories.toLocaleString()} kcal</span>
            </span>
            <ChevronIcon open={isOpen} />
          </div>
        </button>

        {/* ── Progress bar ── */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${color.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          {isOver
            ? `${Math.abs(caloriesLeft).toLocaleString()} kcal over target`
            : `${caloriesLeft.toLocaleString()} kcal remaining`}
        </p>

        {/* ── Food log rows ── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              {logs.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-muted-foreground">No food logged for {split.name.toLowerCase()} yet</p>
                </div>
              ) : (
                <ul className="space-y-0.5 -mx-1">
                  <AnimatePresence initial={false}>
                    {logs.map((log, i) => (
                      <motion.li
                        key={log.id ?? i}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors"
                      >
                        {/* Calorie badge */}
                        <div className="flex-shrink-0 w-12 text-right">
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {Math.round(Number(log.calories ?? 0))}
                          </span>
                          <span className="text-[10px] text-muted-foreground block -mt-0.5">kcal</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-border flex-shrink-0" />

                        {/* Food info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground leading-snug truncate">
                            {log.food_name ?? "Unknown food"}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {MACROS.map(({ key, label, color: macroColor }) => (
                              <span key={key} className="text-[11px] text-muted-foreground tabular-nums">
                                <span className={`font-semibold ${macroColor}`}>{label}</span>{" "}
                                {Math.round(Number(log[key] ?? 0))}g
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Delete */}
                        {log.id && (
                          <button
                            onClick={() => onDelete(log.id!)}
                            disabled={deletingId === log.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-40 rounded-lg hover:bg-destructive/10 transition-all"
                            aria-label={`Remove ${log.food_name ?? "food"}`}
                          >
                            {deletingId === log.id ? (
                              <Spinner className="w-3.5 h-3.5" />
                            ) : (
                              <TrashIcon />
                            )}
                          </button>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
