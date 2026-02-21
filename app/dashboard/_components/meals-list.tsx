"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import type { FoodLogEntry } from "@/types";

interface Props {
  logs: FoodLogEntry[];
  onDelete?: (id: string) => void;
  deletingId?: string;
}

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

const MACROS = [
  { key: "protein_g" as const, label: "P", color: "text-blue-500"   },
  { key: "carbs_g"   as const, label: "C", color: "text-orange-500" },
  { key: "fat_g"     as const, label: "F", color: "text-amber-500"  },
];

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-2xl">
        🍽️
      </div>
      <p className="text-sm font-semibold text-foreground">No meals logged yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Tap &ldquo;+ Add Food&rdquo; below to start tracking
      </p>
    </div>
  );
}

export function MealsList({ logs, onDelete, deletingId }: Props) {
  const totalKcal = logs.reduce((s, l) => s + Number(l.calories ?? 0), 0);

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-emerald-400" />

      <div className="p-5 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Today&apos;s Log
          </p>
          {logs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {Math.round(totalKcal).toLocaleString()} kcal
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {logs.length} item{logs.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <EmptyState />
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
                  transition={{ duration: 0.25, delay: i * 0.04 }}
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
                      {MACROS.map(({ key, label, color }) => (
                        <span key={key} className="text-[11px] text-muted-foreground tabular-nums">
                          <span className={`font-semibold ${color}`}>{label}</span>{" "}
                          {Math.round(Number(log[key] ?? 0))}g
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  {log.id && onDelete && (
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
      </div>
    </section>
  );
}
