import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Home page — pure redirect based on auth + onboarding state.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  not logged in                       → /auth/login           │
 * │  logged in, no users row             → /onboarding           │
 * │  logged in, no daily_goals row       → /onboarding           │
 * │  logged in, fully onboarded          → /dashboard            │
 * └──────────────────────────────────────────────────────────────┘
 */
export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  // Guard against partial onboarding: profile row saved but daily_goals write failed
  const { data: goals } = await supabase
    .from("daily_goals")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!goals) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
