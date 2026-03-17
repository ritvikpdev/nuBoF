"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useWaterToday, useLogWater, useDeleteWaterLog, ML_PER_GLASS } from "@/hooks/use-water";
import type { WaterUnit } from "@/types";
import type { WaterLog } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(ml: number, unit: WaterUnit): string {
  if (unit === "glasses") {
    const glasses = ml / ML_PER_GLASS;
    return `${glasses % 1 === 0 ? glasses : glasses.toFixed(1)} glass${glasses === 1 ? "" : "es"}`;
  }
  if (unit === "both") {
    const glasses = (ml / ML_PER_GLASS).toFixed(1);
    return `${ml} ml · ${glasses} gl`;
  }
  return `${ml} ml`;
}

function formatGoal(goalMl: number, unit: WaterUnit): string {
  if (unit === "glasses") return `${Math.round(goalMl / ML_PER_GLASS)} glasses`;
  if (unit === "both")    return `${goalMl} ml`;
  return `${goalMl} ml`;
}

const QUICK_ADD_OPTIONS = [
  { labelMl: "250 ml",    amountMl: 250  },
  { labelMl: "500 ml",    amountMl: 500  },
  { labelMl: "750 ml",    amountMl: 750  },
  { labelMl: "1 L",       amountMl: 1000 },
];

// ─── Log entry row ────────────────────────────────────────────────────────────

function WaterLogRow({
  log,
  unit,
  onDelete,
}: {
  log: WaterLog;
  unit: WaterUnit;
  onDelete: (id: string) => void;
}) {
  const time = new Date(log.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center justify-between py-2 border-t border-border/60 first:border-t-0 overflow-hidden"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">💧</span>
        <span className="font-medium text-foreground">{formatAmount(log.amount_ml, unit)}</span>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        aria-label="Delete entry"
        className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  goalMl: number;
  unit?: WaterUnit;
}

export function WaterCard({ userId, goalMl, unit = "ml" }: Props) {
  const [logsExpanded, setLogsExpanded] = useState(false);
  const { data } = useWaterToday(userId);
  const logMutation    = useLogWater(userId);
  const deleteMutation = useDeleteWaterLog(userId);

  const totalMl = data?.totalMl ?? 0;
  const logs    = data?.logs    ?? [];
  const pct     = Math.min(1, goalMl > 0 ? totalMl / goalMl : 0);
  const isGoalMet = totalMl >= goalMl;

  function handleAdd(amountMl: number) {
    logMutation.mutate(amountMl, {
      onSuccess: () => {
        toast.success(`+${amountMl} ml added`);
      },
      onError: (err: Error) => {
        toast.error(`Could not log water: ${err.message}`);
      },
    });
  }

  function handleDelete(logId: string) {
    deleteMutation.mutate(logId, {
      onError: (err: Error) => toast.error(`Could not remove entry: ${err.message}`),
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Water Intake
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {unit === "glasses"
                ? data?.totalGlasses ?? 0
                : totalMl}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatGoal(goalMl, unit)}
            </span>
            {isGoalMet && <span className="text-sm">🎉</span>}
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-blue-500/10 text-2xl select-none">
          💧
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_ADD_OPTIONS.map(({ labelMl, amountMl }) => (
          <button
            key={amountMl}
            onClick={() => handleAdd(amountMl)}
            disabled={logMutation.isPending}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            +{labelMl}
          </button>
        ))}
      </div>

      {/* Log history (collapsible) */}
      {logs.length > 0 && (
        <div>
          <button
            onClick={() => setLogsExpanded((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.svg
              animate={{ rotate: logsExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            {logsExpanded ? "Hide" : "Show"} {logs.length} entr{logs.length === 1 ? "y" : "ies"}
          </button>

          <AnimatePresence>
            {logsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2"
              >
                <AnimatePresence>
                  {logs.map((log) => (
                    <WaterLogRow
                      key={log.id}
                      log={log}
                      unit={unit}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {logs.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Tap a quick-add button to log your first glass today.
        </p>
      )}
    </div>
  );
}
