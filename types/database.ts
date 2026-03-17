/**
 * Manual database row types mirroring the Supabase schema.
 * Keep in sync with migrations, or run:
 *   npx supabase gen types typescript --local > types/database.ts
 * to auto-generate the full version.
 */

export interface UserRow {
  id: string;
  created_at: string;
  /** Display name collected during onboarding (migration 003). */
  name: string | null;
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
  primary_goal: string;
  /** Preferred water unit: 'ml' | 'glasses' | 'both' (migration 003). */
  water_unit: string;
}

export interface DailyGoalsRow {
  id: string;
  user_id: string;
  created_at: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_iron_mg: number;
  target_potassium_mg: number | null;
  target_magnesium_mg: number | null;
  target_vitamin_c_mg: number | null;
  target_vitamin_d_mcg: number | null;
  /** Daily water target in ml (migration 003). */
  water_goal_ml: number | null;
}

export interface FoodLogRow {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg: number;
  potassium_mg: number | null;
  magnesium_mg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  /** FK to meal_splits.id; null = uncategorized (migration 002). */
  meal_split_id: string | null;
}

export interface SavedMealRow {
  id: string;
  user_id: string;
  created_at: string;
  meal_name: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_iron_mg: number;
}

export interface MealIngredientRow {
  id: string;
  meal_id: string;
  food_name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** Micronutrients added in migration 004. */
  iron_mg: number;
  potassium_mg: number | null;
  magnesium_mg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
}

export interface MealSplitRow {
  id: string;
  user_id: string;
  name: string;
  percentage: number;
  display_order: number;
  created_at: string;
}

export interface CustomFoodRow {
  id: string;
  user_id: string;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg: number;
  potassium_mg: number | null;
  magnesium_mg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  created_at: string;
}

export interface WaterLogRow {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}
