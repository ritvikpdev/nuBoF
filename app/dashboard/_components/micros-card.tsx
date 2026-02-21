"use client";

import { motion } from "framer-motion";

interface MicroTotals {
  iron_mg: number; potassium_mg: number; magnesium_mg: number;
  vitamin_c_mg: number; vitamin_d_mcg: number;
}
interface MicroTargets {
  iron: number; potassium: number; magnesium: number;
  vitaminC: number; vitaminD: number;
}
interface Props { totals: MicroTotals; targets: MicroTargets }

const MICROS: Array<{
  label: string; icon: string; color: string;
  valKey: keyof MicroTotals; targetKey: keyof MicroTargets; unit: string;
}> = [
  { label: "Iron",      icon: "🩸", color: "#f43f5e", valKey: "iron_mg",       targetKey: "iron",      unit: "mg"  },
  { label: "Potassium", icon: "🫘", color: "#a855f7", valKey: "potassium_mg",  targetKey: "potassium", unit: "mg"  },
  { label: "Magnesium", icon: "✦",  color: "#14b8a6", valKey: "magnesium_mg",  targetKey: "magnesium", unit: "mg"  },
  { label: "Vitamin C", icon: "🍊", color: "#f97316", valKey: "vitamin_c_mg",  targetKey: "vitaminC",  unit: "mg"  },
  { label: "Vitamin D", icon: "☀️", color: "#0ea5e9", valKey: "vitamin_d_mcg", targetKey: "vitaminD",  unit: "mcg" },
];

const pct = (val: number, target: number) =>
  target > 0 ? Math.min(100, (val / target) * 100) : 0;

export function MicrosCard({ totals, targets }: Props) {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-rose-400 via-violet-400 via-teal-400 via-orange-400 to-sky-400" />

      <div className="p-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
          Micronutrients
        </p>

        <div className="space-y-3.5">
          {MICROS.map(({ label, icon, color, valKey, targetKey, unit }, i) => {
            const val      = totals[valKey];
            const target   = targets[targetKey];
            const progress = pct(val, target);

            return (
              <div key={label} className="flex items-center gap-3">
                {/* Icon chip — color-mix tint works in both light and dark mode */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base leading-none"
                  style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
                >
                  {icon}
                </div>

                {/* Label + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    <div className="flex items-center gap-2 text-[11px] tabular-nums">
                      <span className="text-muted-foreground">
                        {val.toFixed(1)}<span className="text-muted-foreground/60">/{target} {unit}</span>
                      </span>
                      <span className="font-bold min-w-[2.2rem] text-right" style={{ color }}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full w-full rounded-full origin-left"
                      style={{ background: color }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: progress / 100 }}
                      transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: i * 0.07 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
