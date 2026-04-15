export type BiologicalSex = "male" | "female";

export type ActivityLevelKey = "sedentary" | "light" | "moderate" | "very";

export type PrimaryGoalKey = "lose" | "maintain" | "gain";

export type SubGoalKey =
  | "standard_loss" | "body_recomp" | "low_carb"
  | "general_health" | "athletic_maintain" | "stay_lean"
  | "lean_gain" | "muscle_build" | "max_gain";

export type WaterUnit = "ml" | "glasses" | "both";

export interface UserProfile {
  id: string;
  name?: string | null;
  sex: BiologicalSex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
  primary_goal: PrimaryGoalKey;
  sub_goal?: SubGoalKey | null;
  water_unit?: WaterUnit;
}

export interface CalculatedTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  /** Iron RDA (NIH) — sex-based */
  targetIronMg: number;
  /** Potassium AI (NIH) — sex-based */
  targetPotassiumMg: number;
  /** Magnesium RDA (NIH) — sex + age-based */
  targetMagnesiumMg: number;
  /** Vitamin C RDA (NIH) — sex-based */
  targetVitaminCMg: number;
  /** Vitamin D RDA (NIH) — age-based */
  targetVitaminDMcg: number;
}

export interface ActivityLevel {
  value: ActivityLevelKey;
  label: string;
  multiplier: number;
}

export interface PrimaryGoal {
  value: PrimaryGoalKey;
  label: string;
}

export interface SubGoal {
  value: SubGoalKey;
  label: string;
  description: string;
  icon: string;
  parentGoal: PrimaryGoalKey;
  calorieOffset: number;
  proteinPerKg: number;
  fatPct: number;
}
