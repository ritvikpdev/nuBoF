"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ActivityLevelKey } from "@/types";

const ACTIVITIES = [
  {
    value: "sedentary" as ActivityLevelKey,
    icon: "🛋️",
    label: "Sedentary",
    desc: "Desk job, little or no exercise",
  },
  {
    value: "light" as ActivityLevelKey,
    icon: "🚶",
    label: "Lightly Active",
    desc: "Light exercise 1–3 days per week",
  },
  {
    value: "moderate" as ActivityLevelKey,
    icon: "🏋️",
    label: "Moderately Active",
    desc: "Moderate exercise 3–5 days per week",
  },
  {
    value: "very" as ActivityLevelKey,
    icon: "🔥",
    label: "Very Active",
    desc: "Hard training 6–7 days per week",
  },
];

const CHECK = (
  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  defaultValue?: ActivityLevelKey;
  onNext: (data: { activity_level: ActivityLevelKey }) => void;
}

export function StepActivity({ defaultValue, onNext }: Props) {
  const [selected, setSelected] = useState<ActivityLevelKey | undefined>(defaultValue);

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Your lifestyle
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        How active are you?
      </h1>
      <p className="text-muted-foreground mb-10">
        Pick the option that best describes your typical week.
      </p>

      <div className="space-y-3 mb-8 text-left">
        {ACTIVITIES.map(({ value, icon, label, desc }) => (
          <motion.button
            key={value}
            type="button"
            whileTap={{ scale: 0.985 }}
            onClick={() => setSelected(value)}
            aria-pressed={selected === value}
            className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              selected === value
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm"
                : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700"
            }`}
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
        onClick={() => selected && onNext({ activity_level: selected })}
        disabled={!selected}
      >
        Continue →
      </Button>
    </div>
  );
}
