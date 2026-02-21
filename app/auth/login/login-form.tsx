"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AuthMode = "login" | "signup" | "reset";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
        setInfo("Check your email for a password reset link.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Check your email for a confirmation link, then log in.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";

  // ── Reset password mode ──────────────────────────────────────────────────────
  if (mode === "reset") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card shadow-xl p-8">
            <h1 className="text-2xl font-semibold text-center text-card-foreground mb-2">
              Reset password
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              {info  && <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">{info}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              ← Back to log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login / signup mode ──────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-center text-card-foreground mb-6">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                {info}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
