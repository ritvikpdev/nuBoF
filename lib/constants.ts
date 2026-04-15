import type { ActivityLevel, PrimaryGoal, SubGoal, DailyTotals, FoodLogEntry } from "@/types";

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

export const SUB_GOALS: SubGoal[] = [
  // ── Lose Weight ──
  {
    value: "standard_loss", label: "Standard Fat Loss",
    description: "Steady deficit for sustainable weight loss",
    icon: "🔥", parentGoal: "lose",
    calorieOffset: -500, proteinPerKg: 1.8, fatPct: 0.25,
  },
  {
    value: "body_recomp", label: "Body Recomposition",
    description: "Lose fat while building muscle with high protein",
    icon: "🔄", parentGoal: "lose",
    calorieOffset: -250, proteinPerKg: 2.2, fatPct: 0.25,
  },
  {
    value: "low_carb", label: "Low-Carb Focused",
    description: "Reduce carbs with higher healthy fats",
    icon: "🥑", parentGoal: "lose",
    calorieOffset: -500, proteinPerKg: 1.8, fatPct: 0.35,
  },
  // ── Maintain Weight ──
  {
    value: "general_health", label: "General Wellness",
    description: "Balanced nutrition for overall health",
    icon: "🌿", parentGoal: "maintain",
    calorieOffset: 0, proteinPerKg: 1.6, fatPct: 0.30,
  },
  {
    value: "athletic_maintain", label: "Athletic Performance",
    description: "Fuel your workouts with more carbs",
    icon: "⚡", parentGoal: "maintain",
    calorieOffset: 0, proteinPerKg: 1.8, fatPct: 0.20,
  },
  {
    value: "stay_lean", label: "Stay Lean",
    description: "Higher protein to preserve muscle definition",
    icon: "🎯", parentGoal: "maintain",
    calorieOffset: 0, proteinPerKg: 2.0, fatPct: 0.25,
  },
  // ── Gain Weight ──
  {
    value: "lean_gain", label: "Lean Muscle Gain",
    description: "Controlled surplus to minimize fat gain",
    icon: "📈", parentGoal: "gain",
    calorieOffset: 250, proteinPerKg: 2.0, fatPct: 0.25,
  },
  {
    value: "muscle_build", label: "Muscle Building",
    description: "Moderate surplus for steady muscle growth",
    icon: "💪", parentGoal: "gain",
    calorieOffset: 400, proteinPerKg: 1.8, fatPct: 0.25,
  },
  {
    value: "max_gain", label: "Maximum Mass",
    description: "Larger surplus for fastest weight gain",
    icon: "🏋️", parentGoal: "gain",
    calorieOffset: 600, proteinPerKg: 1.6, fatPct: 0.25,
  },
];

export const MACRO_COLORS = [
  { key: "protein_g" as keyof FoodLogEntry, label: "P", color: "text-blue-500",     hex: "#3b82f6", kcalPerG: 4 },
  { key: "carbs_g"   as keyof FoodLogEntry, label: "C", color: "text-orange-500",   hex: "#f97316", kcalPerG: 4 },
  { key: "fat_g"     as keyof FoodLogEntry, label: "F", color: "text-amber-500",    hex: "#f59e0b", kcalPerG: 9 },
  { key: "fiber_g"   as keyof FoodLogEntry, label: "Fi", color: "text-emerald-500", hex: "#22c55e", kcalPerG: 0 },
] as const;

export const ZERO_TOTALS: DailyTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  iron_mg: 0,
  potassium_mg: 0,
  magnesium_mg: 0,
  vitamin_c_mg: 0,
  vitamin_d_mcg: 0,
};
