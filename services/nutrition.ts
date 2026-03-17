import type { ParsedFood, UsdaFood, UsdaFoodNutrient, FoodLogEntry, DailyGoals } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ─── USDA nutrient ID constants ───────────────────────────────────────────────
// Reference: https://fdc.nal.usda.gov/api-guide
const NID = {
  ENERGY:    1008,
  PROTEIN:   1003,
  FAT:       1004,
  CARBS:     1005,
  IRON:      1089,
  MAGNESIUM: 1090,
  POTASSIUM: 1092,
  VITAMIN_C: 1162,
  VITAMIN_D: 1114, // Vitamin D (D2+D3), unit: mcg
} as const;

/** Looks up a nutrient value by ID from the USDA foodNutrients array. */
function getNutrient(nutrients: UsdaFoodNutrient[], id: number): number {
  return Number(nutrients.find((n) => n.nutrientId === id)?.value ?? 0);
}

/** Converts a USDA FoodData Central food item into the app's internal ParsedFood shape. */
function parseUsdaFood(food: UsdaFood, index: number): ParsedFood {
  const n = food.foodNutrients ?? [];
  return {
    foodId:        food.fdcId ? String(food.fdcId) : String(index),
    name:          food.description ?? "",
    calories:      Math.round(getNutrient(n, NID.ENERGY)),
    protein_g:     +getNutrient(n, NID.PROTEIN).toFixed(1),
    fat_g:         +getNutrient(n, NID.FAT).toFixed(1),
    carbs_g:       +getNutrient(n, NID.CARBS).toFixed(1),
    iron_mg:       +getNutrient(n, NID.IRON).toFixed(2),
    potassium_mg:  +getNutrient(n, NID.POTASSIUM).toFixed(1),
    magnesium_mg:  +getNutrient(n, NID.MAGNESIUM).toFixed(1),
    vitamin_c_mg:  +getNutrient(n, NID.VITAMIN_C).toFixed(1),
    vitamin_d_mcg: +getNutrient(n, NID.VITAMIN_D).toFixed(1),
  };
}

/**
 * Searches foods via the server-side /api/food/search Route Handler.
 * The USDA API key stays on the server — never exposed to the client.
 * Pass an AbortSignal to cancel stale in-flight requests when a new search starts.
 */
export async function searchFoods(query: string, signal?: AbortSignal): Promise<ParsedFood[]> {
  const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`, { signal });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Search failed: ${res.status}`);
  }

  const data = await res.json() as { foods?: UsdaFood[] };
  return (data.foods ?? []).map((food, index) => parseUsdaFood(food, index));
}

/** Inserts a food entry into food_logs for today (local date). */
export async function logFood(
  userId: string,
  food: ParsedFood,
  mealSplitId?: string | null,
): Promise<void> {
  const supabase = createClient();
  // Use local date (en-CA locale produces YYYY-MM-DD) to avoid UTC midnight cutoff
  const todayStr = new Date().toLocaleDateString("en-CA");

  const { error } = await supabase.from("food_logs").insert({
    user_id: userId,
    date: todayStr,
    food_name: food.name,
    calories: food.calories,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
    iron_mg: food.iron_mg,
    potassium_mg: food.potassium_mg || null,
    magnesium_mg: food.magnesium_mg || null,
    vitamin_c_mg: food.vitamin_c_mg || null,
    vitamin_d_mcg: food.vitamin_d_mcg || null,
    meal_split_id: mealSplitId ?? null,
  });

  if (error) throw error;
}

/**
 * Returns a new ParsedFood with all nutrient values scaled by `qty` (servings).
 * The food name is preserved so log entries remain readable.
 */
export function scaleFood(food: ParsedFood, qty: number): ParsedFood {
  return {
    ...food,
    calories:      Math.round(food.calories      * qty),
    protein_g:     +(food.protein_g     * qty).toFixed(1),
    carbs_g:       +(food.carbs_g       * qty).toFixed(1),
    fat_g:         +(food.fat_g         * qty).toFixed(1),
    iron_mg:       +(food.iron_mg       * qty).toFixed(2),
    potassium_mg:  +(food.potassium_mg  * qty).toFixed(1),
    magnesium_mg:  +(food.magnesium_mg  * qty).toFixed(1),
    vitamin_c_mg:  +(food.vitamin_c_mg  * qty).toFixed(1),
    vitamin_d_mcg: +(food.vitamin_d_mcg * qty).toFixed(1),
  };
}

/** Deletes a food log entry by its primary key. */
export async function deleteLog(logId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("food_logs").delete().eq("id", logId);
  if (error) throw error;
}

const LOG_SELECT =
  "id, user_id, date, food_name, calories, protein_g, carbs_g, fat_g, iron_mg, potassium_mg, magnesium_mg, vitamin_c_mg, vitamin_d_mcg, meal_split_id";

/** Fetches food log entries for a user on a specific date (YYYY-MM-DD). */
export async function getLogsByDate(userId: string, dateStr: string): Promise<FoodLogEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("food_logs")
    .select(LOG_SELECT)
    .eq("user_id", userId)
    .eq("date", dateStr)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

/** Fetches today's food log entries for a user (local date), ordered by insertion time. */
export async function getTodayLogs(userId: string): Promise<FoodLogEntry[]> {
  return getLogsByDate(userId, new Date().toLocaleDateString("en-CA"));
}

/**
 * Fetches all food log entries for a user between two dates (inclusive, YYYY-MM-DD).
 * Used to compute weekly calorie totals for the history trend chart.
 */
export async function getLogsForDateRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<FoodLogEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("food_logs")
    .select(LOG_SELECT)
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Fetches the user's daily nutrition goals. */
export async function getDailyGoals(userId: string): Promise<DailyGoals | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("daily_goals")
    .select(
      "target_calories, target_protein, target_carbs, target_fat, target_iron_mg, target_potassium_mg, target_magnesium_mg, target_vitamin_c_mg, target_vitamin_d_mcg",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
