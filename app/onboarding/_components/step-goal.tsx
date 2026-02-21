"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { PrimaryGoalKey } from "@/types";

const GOALS = [
  {
    value: "lose" as PrimaryGoalKey,
    icon: "📉",
    label: "Lose Weight",
    desc: "500 calorie deficit per day",
  },
  {
    value: "maintain" as PrimaryGoalKey,
    icon: "⚖️",
    label: "Maintain",
    desc: "Stay at current weight & improve body composition",
  },
  {
    value: "gain" as PrimaryGoalKey,
    icon: "💪",
    label: "Gain Muscle",
    desc: "300 calorie surplus per day",
  },
];

const CHECK = (
  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  defaultValue?: PrimaryGoalKey;
  onNext: (data: { primary_goal: PrimaryGoalKey }) => void;
  submitting: boolean;
}

export function StepGoal({ defaultValue, onNext, submitting }: Props) {
  const [selected, setSelected] = useState<PrimaryGoalKey | undefined>(defaultValue);

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-4">
        Almost done!
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        What&apos;s your<br />main goal?
      </h1>
      <p className="text-muted-foreground mb-10">
        We&apos;ll tailor your nutrition targets to help you get there.
      </p>

      <div className="space-y-3 mb-8 text-left">
        {GOALS.map(({ value, icon, label, desc }) => (
          <motion.button
            key={value}
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => !submitting && setSelected(value)}
            aria-pressed={selected === value}
            className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              selected === value
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm"
                : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700"
            } ${submitting ? "pointer-events-none opacity-60" : ""}`}
          >
            <span className="text-2xl flex-shrink-0 leading-none">{icon}</span>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold ${
                  selected === value
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-foreground"
                }`}
              >
                {label}
              </p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            {selected === value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
              >
                {CHECK}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => selected && onNext({ primary_goal: selected })}
        disabled={!selected || submitting}
      >
        {submitting ? (
          <span className="flex items-center gap-2 justify-center">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                fill="currentColor"
                className="opacity-75"
              />
            </svg>
            Calculating your targets…
          </span>
        ) : (
          "Calculate My Targets →"
        )}
      </Button>
    </div>
  );
}
