import type { UserProfile, BiologicalSex, PrimaryGoalKey, SubGoalKey, WaterUnit } from "@/types";
import { createClient } from "@/lib/supabase/client";

/** Returns the user's profile row from the users table, or null if not onboarded. */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, sex, age, height_cm, weight_kg, activity_level, primary_goal, sub_goal, water_unit")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

/** Creates or updates the user's profile row. */
export async function upsertUserProfile(
  userId: string,
  profile: {
    name?: string;
    sex: BiologicalSex;
    age: number;
    height_cm: number;
    weight_kg: number;
    activity_level: number;
    primary_goal: PrimaryGoalKey;
    sub_goal?: SubGoalKey | null;
    water_unit?: WaterUnit;
  },
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .upsert({ id: userId, ...profile }, { onConflict: "id" });

  if (error) throw error;
}

/** Updates only the water_unit preference for a user. */
export async function updateWaterUnit(userId: string, waterUnit: WaterUnit): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ water_unit: waterUnit })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * Creates or updates the user's daily nutrition goals.
 * Uses UPSERT on user_id so re-submitting onboarding replaces the existing row
 * rather than creating duplicates.
 *
 * Requires the database to have: UNIQUE (user_id) on daily_goals.
 * See migrations/001_rls_and_schema_fixes.sql.
 */
export async function saveDailyGoals(
  userId: string,
  goals: {
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fat: number;
    target_iron_mg: number;
    target_potassium_mg: number;
    target_magnesium_mg: number;
    target_vitamin_c_mg: number;
    target_vitamin_d_mcg: number;
    water_goal_ml?: number;
  },
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("daily_goals")
    .upsert({ user_id: userId, ...goals }, { onConflict: "user_id" });

  if (error) throw error;
}
