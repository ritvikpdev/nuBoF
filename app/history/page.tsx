"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { useDailyGoals, useDeleteLog } from "@/hooks/use-nutrition";
import { useLogsByDate, useWeeklyTrend } from "@/hooks/use-history";
import { todayDateStr, formatDateHeading } from "@/lib/dates";
import { DateStrip } from "./_components/date-strip";
import { WeeklyChart } from "./_components/weekly-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { TrashIcon } from "@/components/ui/icons";
import { MACRO_COLORS } from "@/lib/constants";
import type { FoodLogEntry } from "@/types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-4 mt-2">
      {/* Summary card */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <Skeleton className="h-3 w-16" />
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex gap-6">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      {/* Log items */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-1">
        <Skeleton className="h-3 w-20 mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-t border-border first:border-t-0">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day Summary Card ─────────────────────────────────────────────────────────

interface SummaryCardProps {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

function DaySummaryCard({
  calories, protein_g, carbs_g, fat_g,
  targetCalories, targetProtein, targetCarbs, targetFat,
}: SummaryCardProps) {
  const progress  = targetCalories > 0 ? Math.min(100, (calories / targetCalories) * 100) : 0;
  const remaining = targetCalories - calories;
  const isOver    = calories > targetCalories;

  const barClass =
    progress >= 100 ? "from-red-500 to-rose-400"
    : progress >= 85 ? "from-amber-400 to-yellow-300"
    : "from-emerald-500 to-emerald-400";

  const macros = [
    { label: "Protein", value: protein_g, target: targetProtein, color: "#3b82f6" },
    { label: "Carbs",   value: carbs_g,   target: targetCarbs,   color: "#f97316" },
    { label: "Fat",     value: fat_g,     target: targetFat,     color: "#f59e0b" },
  ];

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Colored top accent stripe */}
      <div className={`h-1 bg-gradient-to-r ${barClass} transition-all duration-700`} />

      <div className="p-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Summary
        </p>

        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground tabular-nums leading-none">
              {Math.round(calories).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {targetCalories.toLocaleString()} kcal
            </span>
          </div>
          <span
            className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
              isOver
                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                : "bg-primary/10 text-primary"
            }`}
          >
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full w-full bg-gradient-to-r ${barClass} rounded-full origin-left`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        <p className={`text-xs font-medium mb-4 ${isOver ? "text-red-500 dark:text-red-400" : "text-muted-foreground"}`}>
          {isOver
            ? `${Math.abs(Math.round(remaining)).toLocaleString()} kcal over target`
            : `${Math.round(remaining).toLocaleString()} kcal remaining`}
        </p>

        {/* Macro bars */}
        <div className="grid grid-cols-3 gap-3">
          {macros.map(({ label, value, target, color }) => {
            const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-sm font-bold text-foreground tabular-nums mb-1.5">
                  {Math.round(value)}g
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">/{target}g</span>
                </p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full w-full rounded-full origin-left"
                    style={{ background: color }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Log list for a day ────────────────────────────────────────────────────────

const LOG_MACROS = MACRO_COLORS.slice(0, 3);

interface DayLogListProps {
  logs: FoodLogEntry[];
  onDelete?: (id: string) => void;
  deletingId?: string;
}

function DayLogList({ logs, onDelete, deletingId }: DayLogListProps) {
  if (logs.length === 0) {
    return (
      <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-muted to-muted/40" />
        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
            Food Log
          </p>
          <div className="py-8 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">
              🍽️
            </div>
            <p className="text-sm font-medium text-foreground">Nothing logged yet</p>
            <p className="text-xs text-muted-foreground">No food entries for this day</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Food Log
        </p>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
          {logs.length} item{logs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ul className="divide-y divide-border -mx-5 px-5">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.li
              key={log.id ?? i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="group py-3.5 first:pt-0 last:pb-0 hover:bg-muted/40 -mx-5 px-5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug truncate">
                    {log.food_name ?? "Unknown"}
                  </p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {LOG_MACROS.map(({ key, label, color }) => (
                      <span key={key} className="text-xs text-muted-foreground">
                        <span className={`font-semibold ${color}`}>{label}</span>{" "}
                        {Math.round(Number(log[key] ?? 0))}g
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {Math.round(Number(log.calories ?? 0)).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
                  </div>
                  {log.id && onDelete && (
                    <button
                      onClick={() => onDelete(log.id!)}
                      disabled={deletingId === log.id}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${log.food_name ?? "entry"}`}
                    >
                      {deletingId === log.id ? (
                        <Spinner className="w-3.5 h-3.5" />
                      ) : (
                        <TrashIcon />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  // Data queries
  const { data: goals }    = useDailyGoals(user?.id);
  const { data: dayData, isLoading: dayLoading } = useLogsByDate(user?.id, selectedDate);
  const { data: trendData, isLoading: trendLoading } = useWeeklyTrend(user?.id);

  // Targets (with sensible fallbacks when goals haven't loaded yet)
  const targets = useMemo(() => ({
    calories:  goals?.target_calories ?? 2000,
    protein:   goals?.target_protein  ?? 120,
    carbs:     goals?.target_carbs    ?? 250,
    fat:       goals?.target_fat      ?? 65,
  }), [goals]);

  const deleteMutation = useDeleteLog(
    user?.id,
    ["logs", user?.id, selectedDate],
    [["weeklyTrend", user?.id], ["todayLogs", user?.id]],
  );

  const heading = formatDateHeading(selectedDate);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-6">

        {/* ── Page header with native date-jump ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Review past days</p>
          </div>
          {/* Native date input disguised as a calendar icon button */}
          <label
            className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
            title="Jump to date"
          >
            <svg className="w-4 h-4 pointer-events-none" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              max={todayDateStr()}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        {/* ── 14-day horizontal date strip ── */}
        <div className="mb-5">
          <DateStrip selected={selectedDate} onSelect={setSelectedDate} />
        </div>

        {/* ── Selected day heading ── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={selectedDate}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="text-base font-semibold text-foreground mb-4"
          >
            {heading}
          </motion.p>
        </AnimatePresence>

        {/* ── Loading state ── */}
        {dayLoading && <HistorySkeleton />}

        {/* ── Day content ── */}
        {!dayLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              {/* Summary */}
              <DaySummaryCard
                calories={dayData?.totals.calories    ?? 0}
                protein_g={dayData?.totals.protein_g  ?? 0}
                carbs_g={dayData?.totals.carbs_g      ?? 0}
                fat_g={dayData?.totals.fat_g          ?? 0}
                targetCalories={targets.calories}
                targetProtein={targets.protein}
                targetCarbs={targets.carbs}
                targetFat={targets.fat}
              />

              {/* Log list */}
              <DayLogList
                logs={dayData?.logs ?? []}
                onDelete={(id) => deleteMutation.mutate(id)}
                deletingId={
                  deleteMutation.isPending ? deleteMutation.variables : undefined
                }
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Weekly trend chart ── */}
        {!trendLoading && trendData && trendData.length > 0 && (
          <div className="mt-4">
            <WeeklyChart
              data={trendData}
              targetCalories={targets.calories}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        )}

        {trendLoading && (
          <div className="mt-4 bg-card rounded-2xl border border-border p-5">
            <Skeleton className="h-3 w-20 mb-4" />
            <Skeleton className="h-[180px] w-full rounded-xl" />
          </div>
        )}

      </div>
    </div>
  );
}
