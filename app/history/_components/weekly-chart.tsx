"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import type { DayTrendPoint } from "@/hooks/use-history";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  data: DayTrendPoint[];
  targetCalories: number;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

interface TooltipPayloadEntry {
  payload?: DayTrendPoint;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a bar fill that is visible in both light and dark modes.
 * Non-selected bars use brighter variants in dark mode so they're not
 * washed out against the dark card background.
 */
function barColor(calories: number, target: number, isSelected: boolean, isDark: boolean): string {
  if (calories === 0) {
    return isSelected
      ? (isDark ? "#64748b" : "#94a3b8")
      : (isDark ? "#334155" : "#e2e8f0");
  }
  if (calories > target) {
    return isSelected ? "#f43f5e" : (isDark ? "#fb7185" : "#fda4af");
  }
  if (calories >= target * 0.9) {
    return isSelected ? "#22c55e" : (isDark ? "#4ade80" : "#86efac");
  }
  return isSelected ? "#34d399" : (isDark ? "#6ee7b7" : "#a7f3d0");
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;

  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2.5 shadow-lg text-xs min-w-[110px]">
      <p className="font-semibold text-foreground mb-1">{d.label}</p>
      {d.calories > 0 ? (
        <>
          <p className="text-muted-foreground tabular-nums">
            <span className="text-foreground font-semibold">{d.calories.toLocaleString()}</span> kcal
          </p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-muted-foreground">P <span className="text-blue-500 font-semibold">{Math.round(d.protein_g)}g</span></p>
            <p className="text-muted-foreground">C <span className="text-orange-500 font-semibold">{Math.round(d.carbs_g)}g</span></p>
            <p className="text-muted-foreground">F <span className="text-amber-500 font-semibold">{Math.round(d.fat_g)}g</span></p>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">No data logged</p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeeklyChart({ data, targetCalories, selectedDate, onSelectDate }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const maxCalories = Math.max(targetCalories * 1.2, ...data.map((d) => d.calories), 500);

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          7-day Trend
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Under target
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
            Over target
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 12, right: 4, left: -20, bottom: 0 }}
          onClick={(e: unknown) => {
            const chart = e as { activePayload?: Array<{ payload?: DayTrendPoint }> };
            const point = chart?.activePayload?.[0]?.payload;
            if (point?.dateStr) onSelectDate(point.dateStr);
          }}
          style={{ cursor: "pointer" }}
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-muted-foreground"
          />
          <YAxis hide domain={[0, maxCalories]} />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "transparent" }}
          />
          <ReferenceLine
            y={targetCalories}
            stroke="currentColor"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            className="text-emerald-500/60"
          />
          <Bar
            dataKey="calories"
            radius={[5, 5, 2, 2]}
            maxBarSize={40}
            animationBegin={0}
            animationDuration={700}
          >
            {data.map((entry) => (
              <Cell
                key={entry.dateStr}
                fill={barColor(entry.calories, targetCalories, entry.dateStr === selectedDate, isDark)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── Legend for the reference line ── */}
      <div className="flex items-center gap-1.5 mt-2">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <span key={i} className="inline-block w-1.5 h-0.5 bg-emerald-500/60 rounded-full" />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">
          Target: {targetCalories.toLocaleString()} kcal
        </span>
      </div>
    </section>
  );
}
