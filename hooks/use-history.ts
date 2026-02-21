"use client";

import { useQuery } from "@tanstack/react-query";
import { getLogsByDate, getLogsForDateRange } from "@/services/nutrition";
import { lastNDays, dateStrDaysAgo, getDayAbbrev, getDayOfMonth, getMonthAbbrev } from "@/lib/dates";
import { computeDailyTotals } from "@/lib/log-totals";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayTrendPoint {
  dateStr: string;
  /** e.g. "Mon 12" */
  label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches food logs and computes totals for any given date.
 * Uses the same select transform pattern as useTodayLogs.
 */
export function useLogsByDate(userId: string | undefined, dateStr: string) {
  return useQuery({
    queryKey: ["logs", userId, dateStr],
    queryFn: () => getLogsByDate(userId!, dateStr),
    enabled: !!userId,
    select: (logs) => ({ logs, totals: computeDailyTotals(logs) }),
  });
}

/**
 * Fetches food logs for the past 7 days and aggregates them into daily totals
 * for the weekly trend bar chart.
 */
export function useWeeklyTrend(userId: string | undefined) {
  const endDate   = dateStrDaysAgo(0);
  const startDate = dateStrDaysAgo(6);

  return useQuery({
    queryKey: ["weeklyTrend", userId, startDate, endDate],
    queryFn: () => getLogsForDateRange(userId!, startDate, endDate),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    select(logs) {
      // Build a point for each of the last 7 days, oldest → newest (left → right in chart)
      const days = lastNDays(7).reverse();

      return days.map<DayTrendPoint>((dateStr) => {
        const dayLogs = logs.filter((l) => l.date === dateStr);
        const calories  = Math.round(dayLogs.reduce((s, l) => s + Number(l.calories  ?? 0), 0));
        const protein_g = +(dayLogs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0)).toFixed(1);
        const carbs_g   = +(dayLogs.reduce((s, l) => s + Number(l.carbs_g   ?? 0), 0)).toFixed(1);
        const fat_g     = +(dayLogs.reduce((s, l) => s + Number(l.fat_g     ?? 0), 0)).toFixed(1);

        const abbrev    = getDayAbbrev(dateStr);
        const dayNum    = getDayOfMonth(dateStr);
        const monthAbbr = getMonthAbbrev(dateStr);

        // Label: show month only on the 1st of the month or the first item
        const label = dayNum === 1 ? `${abbrev} ${monthAbbr}` : `${abbrev} ${dayNum}`;

        return { dateStr, label, calories, protein_g, carbs_g, fat_g };
      });
    },
  });
}
