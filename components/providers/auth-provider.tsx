"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
});

/**
 * Provides real-time Supabase auth state to the component tree.
 * Wrap this around the app in the root layout (inside ThemeProvider/QueryProvider).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires immediately with INITIAL_SESSION, removing the need
    // for a separate getSession() call and preventing potential double state updates.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, session, isLoading }}>{children}</AuthContext.Provider>;
}

/** Returns the full auth context (user, session, isLoading). */
export function useAuth() {
  return useContext(AuthContext);
}
