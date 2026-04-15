import type { WaterLog } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { todayDateStr } from "@/lib/dates";

/** Fetches all water log entries for today, ordered oldest first. */
export async function getTodayWater(userId: string): Promise<WaterLog[]> {
  const supabase = createClient();
  const today = todayDateStr();

  const { data, error } = await supabase
    .from("water_logs")
    .select("id, user_id, date, amount_ml, created_at")
    .eq("user_id", userId)
    .eq("date", today)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WaterLog[];
}

/** Logs a water intake event (amount in ml). */
export async function logWater(userId: string, amountMl: number): Promise<WaterLog> {
  const supabase = createClient();
  const today = todayDateStr();

  const { data, error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, date: today, amount_ml: amountMl })
    .select("id, user_id, date, amount_ml, created_at")
    .single();

  if (error) throw error;
  return data as WaterLog;
}

/** Deletes a water log entry by id. */
export async function deleteWaterLog(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("water_logs").delete().eq("id", id);
  if (error) throw error;
}
