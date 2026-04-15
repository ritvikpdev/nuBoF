import type { ParsedFood, UsdaFood, UsdaFoodNutrient, FoodLogEntry, DailyGoals } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { todayDateStr } from "@/lib/dates";
import { normalizeUsdaText } from "@/lib/usda-search";

// ─── USDA nutrient ID constants ───────────────────────────────────────────────
// Reference: https://fdc.nal.usda.gov/api-guide
const NID = {
  ENERGY:    1008,
  PROTEIN:   1003,
  FAT:       1004,
  CARBS:     1005,
  FIBER:     1079, // Fiber, total dietary
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
  const brand = food.brandOwner || food.brandName || undefined;
  const description = food.description ?? "";
  const displayName = brand ? `${brand} - ${description}` : description;

  // USDA nutrient values are always per 100 g regardless of data type.
  // Do NOT use food.servingSize here — that is the branded label serving
  // (e.g. 28 g) and would misrepresent the per-100 g values.
  return {
    foodId:          food.fdcId ? String(food.fdcId) : String(index),
    name:            displayName,
    normalizedName:  normalizeUsdaText(displayName),
    rawDescription:  description,
    dataType:        food.dataType,
    brand,
    calories:        Math.round(getNutrient(n, NID.ENERGY)),
    protein_g:       +getNutrient(n, NID.PROTEIN).toFixed(1),
    fat_g:           +getNutrient(n, NID.FAT).toFixed(1),
    carbs_g:         +getNutrient(n, NID.CARBS).toFixed(1),
    fiber_g:         +getNutrient(n, NID.FIBER).toFixed(1),
    iron_mg:         +getNutrient(n, NID.IRON).toFixed(2),
    potassium_mg:    +getNutrient(n, NID.POTASSIUM).toFixed(1),
    magnesium_mg:    +getNutrient(n, NID.MAGNESIUM).toFixed(1),
    vitamin_c_mg:    +getNutrient(n, NID.VITAMIN_C).toFixed(1),
    vitamin_d_mcg:   +getNutrient(n, NID.VITAMIN_D).toFixed(1),
    matchScore:      Number(food.matchScore ?? 0),
    matchReasons:    Array.isArray(food.matchReasons)
      ? food.matchReasons.filter((reason): reason is string => typeof reason === "string")
      : undefined,
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
  const todayStr = todayDateStr();

  const { error } = await supabase.from("food_logs").insert({
    user_id: userId,
    date: todayStr,
    food_name: food.name,
    calories: food.calories,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
    fiber_g: food.fiber_g ?? null,
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
    fiber_g:       food.fiber_g !== undefined ? +(food.fiber_g * qty).toFixed(1) : undefined,
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

/** Assigns (or clears) the meal split for an existing food log entry. */
export async function updateLogMealSplit(
  logId: string,
  mealSplitId: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("food_logs")
    .update({ meal_split_id: mealSplitId })
    .eq("id", logId);
  if (error) throw error;
}

const LOG_SELECT =
  "id, user_id, date, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, iron_mg, potassium_mg, magnesium_mg, vitamin_c_mg, vitamin_d_mcg, meal_split_id";

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
