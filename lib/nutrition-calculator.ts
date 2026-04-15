import type { BiologicalSex, PrimaryGoalKey, SubGoalKey, CalculatedTargets } from "@/types";
import { SUB_GOALS } from "@/lib/constants";

// ─── Caloric constants ────────────────────────────────────────────────────────
const CAL_PER_G_PROTEIN = 4;
const CAL_PER_G_CARB = 4;
const CAL_PER_G_FAT = 9;

// ─── BMR ──────────────────────────────────────────────────────────────────────

/**
 * Mifflin-St Jeor BMR equation (1990) — widely regarded as the most accurate
 * for the general population.
 *
 * Male:   (10 × kg) + (6.25 × cm) − (5 × age) + 5
 * Female: (10 × kg) + (6.25 × cm) − (5 × age) − 161
 */
function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

// ─── TDEE ─────────────────────────────────────────────────────────────────────

/** TDEE = BMR × Harris-Benedict activity multiplier. */
function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier;
}

// ─── Calorie target by goal ───────────────────────────────────────────────────

/**
 * Adjusts TDEE based on the user's goal.
 * If a sub-goal offset is provided, use it directly. Otherwise fall back to
 * the legacy primary-goal defaults (-500 / 0 / +300).
 */
function getTargetCalories(tdee: number, goal: PrimaryGoalKey, calorieOffset?: number): number {
  if (calorieOffset !== undefined) return tdee + calorieOffset;
  if (goal === "lose") return tdee - 500;
  if (goal === "gain") return tdee + 300;
  return tdee;
}

// ─── Macros ───────────────────────────────────────────────────────────────────

/**
 * Evidence-based macro split with configurable protein and fat ratios.
 * When no overrides are given, defaults to 1.8 g/kg protein and 25% fat.
 */
function getMacros(
  targetCalories: number,
  weightKg: number,
  proteinPerKg = 1.8,
  fatPct = 0.25,
): { proteinG: number; fatG: number; carbsG: number } {
  const proteinG = Math.round(proteinPerKg * weightKg);
  const proteinCal = proteinG * CAL_PER_G_PROTEIN;

  const fatCal = targetCalories * fatPct;
  const fatG = fatCal / CAL_PER_G_FAT;

  const carbsCal = Math.max(0, targetCalories - proteinCal - fatCal);
  const carbsG = carbsCal / CAL_PER_G_CARB;

  return {
    proteinG,
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
  };
}

// ─── Micronutrient RDAs ───────────────────────────────────────────────────────

/**
 * Iron RDA (NIH Office of Dietary Supplements)
 *  Male any age:    8 mg/day
 *  Female 18–50:   18 mg/day  (menstruating)
 *  Female 51+:      8 mg/day  (post-menopausal)
 */
function getTargetIronMg(sex: BiologicalSex, age: number): number {
  if (sex === "female") return age <= 50 ? 18 : 8;
  return 8;
}

/**
 * Potassium Adequate Intake (NIH, 2019)
 *  Male   14+: 3,400 mg/day
 *  Female 14+: 2,600 mg/day
 */
function getTargetPotassiumMg(sex: BiologicalSex): number {
  return sex === "male" ? 3400 : 2600;
}

/**
 * Magnesium RDA (NIH)
 *  Male   18–30: 400 mg/day  |  31+: 420 mg/day
 *  Female 18–30: 310 mg/day  |  31+: 320 mg/day
 */
function getTargetMagnesiumMg(sex: BiologicalSex, age: number): number {
  if (sex === "male") return age <= 30 ? 400 : 420;
  return age <= 30 ? 310 : 320;
}

/**
 * Vitamin C RDA (NIH)
 *  Male   18+: 90 mg/day
 *  Female 18+: 75 mg/day
 */
function getTargetVitaminCMg(sex: BiologicalSex): number {
  return sex === "male" ? 90 : 75;
}

/**
 * Vitamin D RDA (NIH, 2024)
 *  Adults 18–70: 15 mcg/day (600 IU)
 *  Adults  71+:  20 mcg/day (800 IU)
 */
function getTargetVitaminDMcg(age: number): number {
  return age >= 71 ? 20 : 15;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes personalised daily nutrition targets from user biometrics and goal.
 *
 * When a `subGoal` is provided its calorie offset, protein g/kg, and fat
 * percentage are used for precise personalisation. Without one the function
 * falls back to the original hardcoded defaults (backwards-compatible for
 * users who onboarded before sub-goals existed).
 */
export function calculateTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
  activityMultiplier: number,
  goal: PrimaryGoalKey,
  subGoal?: SubGoalKey,
): CalculatedTargets {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = calculateTDEE(bmr, activityMultiplier);

  const sg = subGoal ? SUB_GOALS.find((s) => s.value === subGoal) : undefined;

  const targetCalories = Math.round(
    getTargetCalories(tdee, goal, sg?.calorieOffset),
  );
  const { proteinG, fatG, carbsG } = getMacros(
    targetCalories,
    weightKg,
    sg?.proteinPerKg,
    sg?.fatPct,
  );

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    targetProteinG: proteinG,
    targetCarbsG: carbsG,
    targetFatG: fatG,
    targetIronMg: getTargetIronMg(sex, age),
    targetPotassiumMg: getTargetPotassiumMg(sex),
    targetMagnesiumMg: getTargetMagnesiumMg(sex, age),
    targetVitaminCMg: getTargetVitaminCMg(sex),
    targetVitaminDMcg: getTargetVitaminDMcg(age),
  };
}
