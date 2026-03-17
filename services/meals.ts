import type { SavedMeal, MealIngredient, ParsedFood } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { scaleFood } from "./nutrition";

// ─── Extended types ────────────────────────────────────────────────────────────

export interface SavedMealWithIngredients extends SavedMeal {
  meal_ingredients: MealIngredient[];
}

/** A food item being assembled in the create-meal builder (not yet persisted). */
export interface DraftIngredient {
  /** Stable local key for list operations. */
  draftId: string;
  food: ParsedFood;
  qty: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumTotals(ingredients: DraftIngredient[]) {
  return ingredients.reduce(
    (acc, { food, qty }) => {
      const s = scaleFood(food, qty);
      return {
        total_calories:  Math.round(acc.total_calories  + s.calories),
        total_protein_g: +(acc.total_protein_g + s.protein_g).toFixed(1),
        total_carbs_g:   +(acc.total_carbs_g   + s.carbs_g  ).toFixed(1),
        total_fat_g:     +(acc.total_fat_g     + s.fat_g    ).toFixed(1),
        total_iron_mg:   +(acc.total_iron_mg   + s.iron_mg  ).toFixed(2),
      };
    },
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0, total_iron_mg: 0 },
  );
}

// ─── Service functions ─────────────────────────────────────────────────────────

/** Fetches all saved meals for a user, with their ingredients, newest first. */
export async function getSavedMeals(userId: string): Promise<SavedMealWithIngredients[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("saved_meals")
    .select("*, meal_ingredients(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedMealWithIngredients[];
}

/**
 * Creates a saved meal with its ingredients.
 *
 * The two writes are not wrapped in a DB transaction (PostgREST client limitation),
 * so if the ingredients insert fails we immediately delete the just-created meal row
 * to avoid leaving an orphaned record.
 */
export async function createSavedMeal(
  userId: string,
  name: string,
  ingredients: DraftIngredient[],
): Promise<void> {
  const supabase = createClient();

  const totals = sumTotals(ingredients);

  const { data: meal, error: mealErr } = await supabase
    .from("saved_meals")
    .insert({ user_id: userId, meal_name: name.trim(), ...totals })
    .select("id")
    .single();

  if (mealErr) throw mealErr;

  const rows = ingredients.map(({ food, qty }) => {
    const s = scaleFood(food, qty);
    return {
      meal_id:       meal.id,
      food_name:     s.name,
      serving_size:  qty === 1 ? "1 serving" : `${qty} servings`,
      calories:      s.calories,
      protein_g:     s.protein_g,
      carbs_g:       s.carbs_g,
      fat_g:         s.fat_g,
      // Micros — preserved so they flow through correctly when the meal is logged
      iron_mg:       s.iron_mg,
      potassium_mg:  s.potassium_mg  || null,
      magnesium_mg:  s.magnesium_mg  || null,
      vitamin_c_mg:  s.vitamin_c_mg  || null,
      vitamin_d_mcg: s.vitamin_d_mcg || null,
    };
  });

  const { error: ingErr } = await supabase.from("meal_ingredients").insert(rows);

  if (ingErr) {
    // Compensating delete: remove the orphaned saved_meals row so the DB
    // stays consistent even though we can't do a real transaction here.
    await supabase.from("saved_meals").delete().eq("id", meal.id);
    throw ingErr;
  }
}

/** Deletes a saved meal and all its ingredients (ingredients first to satisfy FK). */
export async function deleteSavedMeal(mealId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("meal_ingredients").delete().eq("meal_id", mealId);
  const { error } = await supabase.from("saved_meals").delete().eq("id", mealId);
  if (error) throw error;
}

/**
 * Logs every ingredient of a saved meal as individual food_log entries for today.
 * Each ingredient becomes its own line in the dashboard so calorie sources are visible.
 * Micronutrients are read from the stored ingredient data so they appear correctly
 * on the Micronutrients card after logging.
 * An optional mealSplitId assigns all logged rows to the same meal split.
 */
export async function logSavedMeal(
  userId: string,
  meal: SavedMealWithIngredients,
  mealSplitId?: string | null,
): Promise<void> {
  const supabase = createClient();
  const todayStr = new Date().toLocaleDateString("en-CA");

  const rows = meal.meal_ingredients.map((ing) => ({
    user_id:       userId,
    date:          todayStr,
    food_name:     ing.food_name,
    calories:      ing.calories,
    protein_g:     ing.protein_g,
    carbs_g:       ing.carbs_g,
    fat_g:         ing.fat_g,
    // Use stored micro values; fall back to 0 / null for older rows created
    // before migration 004 added these columns.
    iron_mg:       ing.iron_mg       ?? 0,
    potassium_mg:  ing.potassium_mg  ?? null,
    magnesium_mg:  ing.magnesium_mg  ?? null,
    vitamin_c_mg:  ing.vitamin_c_mg  ?? null,
    vitamin_d_mcg: ing.vitamin_d_mcg ?? null,
    meal_split_id: mealSplitId ?? null,
  }));

  const { error } = await supabase.from("food_logs").insert(rows);
  if (error) throw error;
}
