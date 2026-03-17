import type { MealSplit } from "@/types";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_SPLITS: Array<{ name: string; percentage: number; display_order: number }> = [
  { name: "Breakfast", percentage: 25, display_order: 0 },
  { name: "Lunch",     percentage: 35, display_order: 1 },
  { name: "Dinner",    percentage: 30, display_order: 2 },
  { name: "Snacks",    percentage: 10, display_order: 3 },
];

/** Fetches all meal splits for a user, ordered by display_order. */
export async function getMealSplits(userId: string): Promise<MealSplit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meal_splits")
    .select("id, user_id, name, percentage, display_order, created_at")
    .eq("user_id", userId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Creates a new meal split. Returns the created row. */
export async function createSplit(
  userId: string,
  name: string,
  percentage: number,
  display_order: number,
): Promise<MealSplit> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meal_splits")
    .insert({ user_id: userId, name, percentage, display_order })
    .select("id, user_id, name, percentage, display_order, created_at")
    .single();

  if (error) throw error;
  return data;
}

/** Updates a meal split's name and/or percentage. */
export async function updateSplit(
  splitId: string,
  updates: Partial<Pick<MealSplit, "name" | "percentage" | "display_order">>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("meal_splits")
    .update(updates)
    .eq("id", splitId);

  if (error) throw error;
}

/** Deletes a meal split. Logs assigned to it will have meal_split_id set to NULL automatically (ON DELETE SET NULL). */
export async function deleteSplit(splitId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("meal_splits")
    .delete()
    .eq("id", splitId);

  if (error) throw error;
}

/**
 * Seeds the four default meal splits (Breakfast 25%, Lunch 35%, Dinner 30%, Snacks 10%)
 * for a new user. Safe to call multiple times — skips seeding if splits already exist.
 */
export async function seedDefaultSplits(userId: string): Promise<void> {
  const existing = await getMealSplits(userId);
  if (existing.length > 0) return;

  const supabase = createClient();
  const { error } = await supabase.from("meal_splits").insert(
    DEFAULT_SPLITS.map((s) => ({ ...s, user_id: userId })),
  );

  if (error) throw error;
}
