import type { ActivityLevel, PrimaryGoal, DailyTotals } from "@/types";

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { value: "sedentary", label: "Sedentary (1.2)", multiplier: 1.2 },
  { value: "light", label: "Lightly Active (1.375)", multiplier: 1.375 },
  { value: "moderate", label: "Moderately Active (1.55)", multiplier: 1.55 },
  { value: "very", label: "Very Active (1.725)", multiplier: 1.725 },
];

export const PRIMARY_GOALS: PrimaryGoal[] = [
  { value: "lose", label: "Lose Weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain Muscle" },
];

export const ZERO_TOTALS: DailyTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  iron_mg: 0,
  potassium_mg: 0,
  magnesium_mg: 0,
  vitamin_c_mg: 0,
  vitamin_d_mcg: 0,
};
