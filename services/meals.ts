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
 * Creates a saved meal with its ingredients in two sequential writes.
 * Totals are derived from the draft ingredients so they're always in sync.
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
      meal_id:      meal.id,
      food_name:    s.name,
      serving_size: qty === 1 ? "1 serving" : `${qty} servings`,
      calories:     s.calories,
      protein_g:    s.protein_g,
      carbs_g:      s.carbs_g,
      fat_g:        s.fat_g,
    };
  });

  const { error: ingErr } = await supabase.from("meal_ingredients").insert(rows);
  if (ingErr) throw ingErr;
}

/** Deletes a saved meal. Ingredients are removed first to satisfy FK constraints. */
export async function deleteSavedMeal(mealId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("meal_ingredients").delete().eq("meal_id", mealId);
  const { error } = await supabase.from("saved_meals").delete().eq("id", mealId);
  if (error) throw error;
}

/**
 * Logs every ingredient of a saved meal as individual food_log entries for today.
 * Each ingredient becomes its own line in the dashboard so calorie sources are visible.
 */
export async function logSavedMeal(
  userId: string,
  meal: SavedMealWithIngredients,
): Promise<void> {
  const supabase = createClient();
  const todayStr = new Date().toLocaleDateString("en-CA");

  const rows = meal.meal_ingredients.map((ing) => ({
    user_id:      userId,
    date:         todayStr,
    food_name:    ing.food_name,
    calories:     ing.calories,
    protein_g:    ing.protein_g,
    carbs_g:      ing.carbs_g,
    fat_g:        ing.fat_g,
    iron_mg:      0,
    potassium_mg: null,
    magnesium_mg: null,
    vitamin_c_mg: null,
    vitamin_d_mcg: null,
  }));

  const { error } = await supabase.from("food_logs").insert(rows);
  if (error) throw error;
}
