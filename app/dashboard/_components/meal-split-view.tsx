"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { TrashIcon, MoveIcon } from "@/components/ui/icons";
import { MACRO_COLORS } from "@/lib/constants";
import type { FoodLogEntry, MealSplit, DailyGoals } from "@/types";
import { MealSplitSection } from "./meal-split-section";

const MACROS = MACRO_COLORS.slice(0, 3);

interface Props {
  splits: MealSplit[];
  splitsLoading: boolean;
  logs: FoodLogEntry[];
  goals: DailyGoals;
  onDelete: (logId: string) => void;
  deletingId?: string;
  onMove: (logId: string, splitId: string) => void;
  movingId?: string;
  onManage: () => void;
}

/** Section for logs that have no meal_split_id. */
function UncategorizedSection({
  logs,
  splits,
  onDelete,
  onMove,
  deletingId,
  movingId,
}: {
  logs: FoodLogEntry[];
  splits: MealSplit[];
  onDelete: (id: string) => void;
  onMove: (logId: string, splitId: string) => void;
  deletingId?: string;
  movingId?: string;
}) {
  const [moveOpenId, setMoveOpenId] = useState<string | null>(null);

  if (logs.length === 0) return null;

  return (
    <section className="bg-card rounded-2xl border border-dashed border-border shadow-sm overflow-hidden">
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Uncategorized
        </p>
        <ul className="space-y-0.5 -mx-1">
          {logs.map((log, i) => {
            const id = log.id ?? String(i);
            const isMoving = movingId === log.id;
            const pickerOpen = moveOpenId === id;

            return (
              <li key={id} className="rounded-xl overflow-hidden">
                {/* Main row */}
                <div className="group flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors">
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

                  {/* Action buttons — visible on hover or when picker is open */}
                  {log.id && (
                    <div className={`flex items-center gap-1 transition-opacity ${pickerOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {/* Move button */}
                      {splits.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMoveOpenId(pickerOpen ? null : id)}
                          disabled={isMoving}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            pickerOpen
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          } disabled:opacity-40`}
                          aria-label={`Move ${log.food_name ?? "food"} to a meal`}
                          aria-expanded={pickerOpen}
                        >
                          {isMoving ? <Spinner className="w-3.5 h-3.5" /> : <MoveIcon />}
                        </button>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={() => onDelete(log.id!)}
                        disabled={deletingId === log.id}
                        className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-40 rounded-lg hover:bg-destructive/10 transition-all cursor-pointer"
                        aria-label={`Remove ${log.food_name ?? "food"}`}
                      >
                        {deletingId === log.id ? (
                          <Spinner className="w-3.5 h-3.5" />
                        ) : (
                          <TrashIcon />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline move-to picker */}
                <AnimatePresence initial={false}>
                  {pickerOpen && splits.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Move to
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {splits.map((split) => (
                            <button
                              key={split.id}
                              type="button"
                              onClick={() => {
                                onMove(log.id!, split.id);
                                setMoveOpenId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
                            >
                              {split.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
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
  onMove,
  movingId,
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
          splits={splits}
          onDelete={onDelete}
          onMove={onMove}
          deletingId={deletingId}
          movingId={movingId}
        />
      )}
    </div>
  );
}
