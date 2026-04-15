import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import { buildNuriSystemPrompt } from "@/lib/nuri-system-prompt";
import type { NuriUserContext } from "@/lib/nuri-system-prompt";
import type { UserProfile } from "@/types/user";
import type { DailyGoals, FoodLogEntry } from "@/types/nutrition";
import { computeDailyTotals } from "@/lib/log-totals";

const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = (
    request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  )
    .split(",")[0]
    .trim();

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "AI assistant is not configured on this server.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const today = new Date().toLocaleDateString("en-CA");

  const [profileResult, goalsResult, logsResult] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, name, sex, age, height_cm, weight_kg, activity_level, primary_goal, sub_goal, water_unit",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("daily_goals")
      .select(
        "target_calories, target_protein, target_carbs, target_fat, target_iron_mg, target_potassium_mg, target_magnesium_mg, target_vitamin_c_mg, target_vitamin_d_mcg, water_goal_ml",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("food_logs")
      .select(
        "id, user_id, date, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, iron_mg, potassium_mg, magnesium_mg, vitamin_c_mg, vitamin_d_mcg, meal_split_id",
      )
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  const profile = (profileResult.data as UserProfile | null) ?? null;
  const goals = (goalsResult.data as DailyGoals | null) ?? null;
  const todayLogs = (logsResult.data as FoodLogEntry[] | null) ?? [];
  const todayTotals = todayLogs.length > 0 ? computeDailyTotals(todayLogs) : null;

  const userContext: NuriUserContext = { profile, goals, todayTotals, todayLogs };
  const systemPrompt = buildNuriSystemPrompt(userContext);

  const body = (await request.json()) as { messages: UIMessage[] };

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(body.messages),
    maxOutputTokens: 1024,
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
