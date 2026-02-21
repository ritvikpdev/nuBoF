import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a Supabase client for use in Client Components.
 * Uses cookies (via @supabase/ssr) so the session is visible server-side too.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
