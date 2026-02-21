"use client";

import { motion } from "framer-motion";

interface Props {
  consumed: number;
  target: number;
}

export function CaloriesCard({ consumed, target }: Props) {
  const progress  = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const remaining = target - consumed;
  const isOver    = consumed > target;

  // Bar color shifts green → amber → red as the user fills up
  const barClass =
    progress >= 100 ? "from-red-500 to-rose-400"
    : progress >= 85 ? "from-amber-400 to-yellow-300"
    : "from-emerald-500 to-emerald-400";

  const remainingText = isOver
    ? `${Math.abs(Math.round(remaining)).toLocaleString()} kcal over target`
    : `${Math.round(remaining).toLocaleString()} kcal remaining`;

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Colored top accent stripe */}
      <div className={`h-1 bg-gradient-to-r ${barClass} transition-all duration-700`} />

      <div className="p-5 pt-4">
        {/* Label */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Calories
        </p>

        {/* Numbers */}
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground tabular-nums leading-none">
              {Math.round(consumed).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              / {target.toLocaleString()} kcal
            </span>
          </div>
          {/* Percentage badge */}
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

        {/* Progress bar */}
        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full w-full bg-gradient-to-r ${barClass} rounded-full origin-left`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        <p className={`text-xs font-medium ${isOver ? "text-red-500 dark:text-red-400" : "text-muted-foreground"}`}>
          {remainingText}
        </p>
      </div>
    </section>
  );
}
