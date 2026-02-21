"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MacroTotals  { protein_g: number; carbs_g: number; fat_g: number }
interface MacroTargets { protein: number;   carbs: number;   fat: number  }
interface Props { totals: MacroTotals; targets: MacroTargets }

// ─── Config ───────────────────────────────────────────────────────────────────

const MACRO_CONFIG = [
  { label: "Protein", color: "#3b82f6", track: "#eff6ff", kcalPerG: 4 },
  { label: "Carbs",   color: "#f97316", track: "#fff7ed", kcalPerG: 4 },
  { label: "Fat",     color: "#f59e0b", track: "#fffbeb", kcalPerG: 9 },
] as const;

const EMPTY_COLOR = "#cbd5e1";

const pct = (val: number, target: number) =>
  target > 0 ? Math.min(100, (val / target) * 100) : 0;

// ─── Component ────────────────────────────────────────────────────────────────

export function MacrosCard({ totals, targets }: Props) {
  const macros = useMemo(
    () => [
      { ...MACRO_CONFIG[0], grams: totals.protein_g, target: targets.protein, kcal: totals.protein_g * 4 },
      { ...MACRO_CONFIG[1], grams: totals.carbs_g,   target: targets.carbs,   kcal: totals.carbs_g   * 4 },
      { ...MACRO_CONFIG[2], grams: totals.fat_g,     target: targets.fat,     kcal: totals.fat_g     * 9 },
    ],
    [totals, targets],
  );

  const totalKcal = useMemo(() => macros.reduce((s, m) => s + m.kcal, 0), [macros]);

  const chartData = useMemo(
    () =>
      totalKcal > 0
        ? macros.filter((m) => m.kcal > 0).map((m) => ({ name: m.label, value: m.kcal, color: m.color }))
        : [{ name: "", value: 1, color: EMPTY_COLOR }],
    [macros, totalKcal],
  );

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-orange-400 to-amber-400" />

      <div className="p-5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
          Macros
        </p>

        {/* ── Donut ── */}
        <div className="flex justify-center mb-2">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <PieChart width={180} height={180}>
              <Pie
                data={chartData}
                cx={90} cy={90}
                innerRadius={56} outerRadius={84}
                paddingAngle={totalKcal > 0 ? 3 : 0}
                startAngle={90} endAngle={-270}
                dataKey="value"
                strokeWidth={0}
                animationBegin={0}
                animationDuration={900}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-xl font-bold text-foreground tabular-nums leading-none">
                {Math.round(totalKcal).toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">kcal</span>
            </div>
          </div>
        </div>

        {/* ── Persistent legend ── */}
        {totalKcal > 0 && (
          <div className="flex justify-center gap-6 mb-5">
            {macros.map(({ label, color, kcal }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>
                  {Math.round(kcal)} kcal
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Progress bars ── */}
        <div className="grid grid-cols-3 gap-3">
          {macros.map(({ label, grams, target, color }, i) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
              </div>
              <p className="text-sm font-bold text-foreground tabular-nums leading-none">
                {Math.round(grams)}g
                <span className="text-xs font-normal text-muted-foreground ml-0.5">/{target}g</span>
              </p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-full rounded-full origin-left"
                  style={{ background: color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: pct(grams, target) / 100 }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: i * 0.08 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
