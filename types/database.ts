/**
 * Manual database row types mirroring the Supabase schema.
 * Run `npx supabase gen types typescript --local` to auto-generate the full version.
 */

export interface UserRow {
  id: string;
  created_at: string;
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
  primary_goal: string;
}

export interface DailyGoalsRow {
  id: string;
  user_id: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_iron_mg: number;
  target_potassium_mg: number | null;
  target_magnesium_mg: number | null;
  target_vitamin_c_mg: number | null;
  target_vitamin_d_mcg: number | null;
}

export interface FoodLogRow {
  id: string;
  user_id: string;
  date: string;
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
}

export interface SavedMealRow {
  id: string;
  user_id: string;
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
}
