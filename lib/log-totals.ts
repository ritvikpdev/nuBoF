import { ZERO_TOTALS } from "@/lib/constants";
import type { FoodLogEntry, DailyTotals } from "@/types";

/**
 * Reduces a list of food log entries into a single DailyTotals object.
 * Centralises the accumulation logic so it isn't duplicated across hooks.
 */
export function computeDailyTotals(logs: FoodLogEntry[]): DailyTotals {
  return logs.reduce<DailyTotals>(
    (acc, log) => ({
      calories:      acc.calories      + Number(log.calories      ?? 0),
      protein_g:     acc.protein_g     + Number(log.protein_g     ?? 0),
      carbs_g:       acc.carbs_g       + Number(log.carbs_g       ?? 0),
      fat_g:         acc.fat_g         + Number(log.fat_g         ?? 0),
      fiber_g:       acc.fiber_g       + Number(log.fiber_g       ?? 0),
      iron_mg:       acc.iron_mg       + Number(log.iron_mg       ?? 0),
      potassium_mg:  acc.potassium_mg  + Number(log.potassium_mg  ?? 0),
      magnesium_mg:  acc.magnesium_mg  + Number(log.magnesium_mg  ?? 0),
      vitamin_c_mg:  acc.vitamin_c_mg  + Number(log.vitamin_c_mg  ?? 0),
      vitamin_d_mcg: acc.vitamin_d_mcg + Number(log.vitamin_d_mcg ?? 0),
    }),
    { ...ZERO_TOTALS },
  );
}
