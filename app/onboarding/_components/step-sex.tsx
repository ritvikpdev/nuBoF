"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { BiologicalSex } from "@/types";

const OPTIONS = [
  { value: "male" as BiologicalSex, label: "Male", symbol: "♂" },
  { value: "female" as BiologicalSex, label: "Female", symbol: "♀" },
];

const CHECK = (
  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  defaultValue?: BiologicalSex;
  onNext: (data: { sex: BiologicalSex }) => void;
}

export function StepSex({ defaultValue, onNext }: Props) {
  const [selected, setSelected] = useState<BiologicalSex | undefined>(defaultValue);

  function handleSelect(value: BiologicalSex) {
    setSelected(value);
    // Brief visual confirmation before auto-advancing
    setTimeout(() => onNext({ sex: value }), 280);
  }

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        About you
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        What&apos;s your<br />biological sex?
      </h1>
      <p className="text-muted-foreground mb-14">
        Used to accurately calculate your BMR.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {OPTIONS.map(({ value, label, symbol }) => (
          <motion.button
            key={value}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(value)}
            aria-pressed={selected === value}
            className={`relative rounded-2xl border-2 py-10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              selected === value
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm"
                : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700"
            }`}
          >
            {selected === value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                {CHECK}
              </motion.div>
            )}
            <div className="text-4xl mb-3 leading-none">{symbol}</div>
            <div className="text-lg font-semibold text-foreground">{label}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
