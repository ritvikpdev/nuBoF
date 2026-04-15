import type { CustomFood, ParsedFood } from "@/types";
import { createClient } from "@/lib/supabase/client";

const CUSTOM_FOOD_SELECT =
  "id, user_id, name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, iron_mg, potassium_mg, magnesium_mg, vitamin_c_mg, vitamin_d_mcg, created_at";

/** Fetches all custom foods for a user, ordered newest first. */
export async function getCustomFoods(userId: string): Promise<CustomFood[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("custom_foods")
    .select(CUSTOM_FOOD_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomFood[];
}

export interface CreateCustomFoodInput {
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number | null;
  iron_mg: number;
  potassium_mg?: number | null;
  magnesium_mg?: number | null;
  vitamin_c_mg?: number | null;
  vitamin_d_mcg?: number | null;
}

/** Creates a new custom food entry. Returns the created row. */
export async function createCustomFood(
  userId: string,
  input: CreateCustomFoodInput,
): Promise<CustomFood> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("custom_foods")
    .insert({ user_id: userId, ...input })
    .select(CUSTOM_FOOD_SELECT)
    .single();

  if (error) throw error;
  return data as CustomFood;
}

/** Deletes a custom food by id. */
export async function deleteCustomFood(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("custom_foods").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Converts a CustomFood row into a ParsedFood so it can flow through the
 * existing FoodDetailSheet → scaleFood → logFood pipeline unchanged.
 *
 * The `custom-` prefix on foodId distinguishes custom foods from USDA foods
 * in the optimistic cache so they never collide.
 */
export function toCustomParsedFood(food: CustomFood): ParsedFood {
  return {
    foodId:          `custom-${food.id}`,
    name:            food.name,
    calories:        food.calories,
    protein_g:       Number(food.protein_g),
    carbs_g:         Number(food.carbs_g),
    fat_g:           Number(food.fat_g),
    fiber_g:         food.fiber_g !== null ? Number(food.fiber_g) : undefined,
    iron_mg:         Number(food.iron_mg),
    potassium_mg:    Number(food.potassium_mg  ?? 0),
    magnesium_mg:    Number(food.magnesium_mg  ?? 0),
    vitamin_c_mg:    Number(food.vitamin_c_mg  ?? 0),
    vitamin_d_mcg:   Number(food.vitamin_d_mcg ?? 0),
    servingSize:     Number(food.serving_size),
    servingSizeUnit: food.serving_unit,
  };
}
