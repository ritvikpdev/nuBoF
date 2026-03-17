"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import type { FoodLogEntry, MealSplit, DailyGoals } from "@/types";
import { MealSplitSection } from "./meal-split-section";

interface Props {
  splits: MealSplit[];
  splitsLoading: boolean;
  logs: FoodLogEntry[];
  goals: DailyGoals;
  onDelete: (logId: string) => void;
  deletingId?: string;
  onManage: () => void;
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

/** Section for logs that have no meal_split_id. */
function UncategorizedSection({
  logs,
  onDelete,
  deletingId,
}: {
  logs: FoodLogEntry[];
  onDelete: (id: string) => void;
  deletingId?: string;
}) {
  if (logs.length === 0) return null;

  return (
    <section className="bg-card rounded-2xl border border-dashed border-border shadow-sm overflow-hidden">
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Uncategorized
        </p>
        <ul className="space-y-0.5 -mx-1">
          {logs.map((log, i) => (
            <li
              key={log.id ?? i}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors"
            >
              <div className="flex-shrink-0 w-12 text-right">
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {Math.round(Number(log.calories ?? 0))}
                </span>
                <span className="text-[10px] text-muted-foreground block -mt-0.5">kcal</span>
              </div>
              <div className="w-px h-6 bg-border flex-shrink-0" />
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MealSplitView({
  splits,
  splitsLoading,
  logs,
  goals,
  onDelete,
  deletingId,
  onManage,
}: Props) {
  /** Group logs by meal_split_id. */
  const logsBySplit = useMemo(() => {
    const map = new Map<string | null, FoodLogEntry[]>();
    for (const log of logs) {
      const key = log.meal_split_id ?? null;
      const bucket = map.get(key) ?? [];
      bucket.push(log);
      map.set(key, bucket);
    }
    return map;
  }, [logs]);

  const uncategorized = logsBySplit.get(null) ?? [];

  return (
    <div className="space-y-3">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Today&apos;s Meals
        </p>
        <button
          onClick={onManage}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Manage Splits
        </button>
      </div>

      {/* ── Loading state ── */}
      {splitsLoading && (
        <div className="flex items-center justify-center py-8">
          <Spinner className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      {/* ── No splits configured ── */}
      {!splitsLoading && splits.length === 0 && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-xl">
            🍽️
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No meal splits yet</p>
          <p className="text-xs text-muted-foreground mb-3">
            Set up meal splits to track calories per meal
          </p>
          <button
            onClick={onManage}
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            Add meal splits
          </button>
        </div>
      )}

      {/* ── Split sections ── */}
      {!splitsLoading && splits.map((split, i) => (
        <motion.div
          key={split.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <MealSplitSection
            split={split}
            logs={logsBySplit.get(split.id) ?? []}
            goals={goals}
            onDelete={onDelete}
            deletingId={deletingId}
          />
        </motion.div>
      ))}

      {/* ── Uncategorized ── */}
      {uncategorized.length > 0 && (
        <UncategorizedSection
          logs={uncategorized}
          onDelete={onDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
