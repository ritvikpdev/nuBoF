export interface DailyGoals {
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_iron_mg: number;
  target_potassium_mg?: number | null;
  target_magnesium_mg?: number | null;
  target_vitamin_c_mg?: number | null;
  target_vitamin_d_mcg?: number | null;
  water_goal_ml?: number | null;
}

/** A user-created food entry stored in the custom_foods table. */
export interface CustomFood {
  id: string;
  user_id: string;
  name: string;
  /** Nutrition values are defined per this serving size (e.g. 100). */
  serving_size: number;
  /** Unit for the serving size: 'g' | 'oz' | 'ml'. */
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

export interface WaterLog {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export interface FoodLogEntry {
  id?: string;
  user_id?: string;
  date?: string;
  food_name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  iron_mg?: number;
  potassium_mg?: number | null;
  magnesium_mg?: number | null;
  vitamin_c_mg?: number | null;
  vitamin_d_mcg?: number | null;
  meal_split_id?: string | null;
}

export interface MealSplit {
  id: string;
  user_id: string;
  name: string;
  percentage: number;
  display_order: number;
  created_at: string;
}

export interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
}

/** A single nutrient entry inside a USDA FoodData Central food item. */
export interface UsdaFoodNutrient {
  nutrientId: number;
  value: number;
  [key: string]: unknown;
}

/** A food item returned by the USDA /foods/search endpoint. */
export interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
  [key: string]: unknown;
}

export interface ParsedFood {
  /** USDA FDC ID (falls back to stringified index if absent). */
  foodId: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  iron_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
  servingSize?: number;
  servingSizeUnit?: string;
}

export interface SavedMeal {
  id?: string;
  user_id?: string;
  meal_name: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_iron_mg: number;
}

export interface MealIngredient {
  id?: string;
  meal_id?: string;
  food_name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  // Micros added in migration 004; optional so pre-migration rows remain compatible.
  iron_mg?: number | null;
  potassium_mg?: number | null;
  magnesium_mg?: number | null;
  vitamin_c_mg?: number | null;
  vitamin_d_mcg?: number | null;
}
