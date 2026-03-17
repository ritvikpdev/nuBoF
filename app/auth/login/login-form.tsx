"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "reset";

// ── Shared page shell ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}

// ── Input with focus glow ─────────────────────────────────────────────────────

interface FocusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

function FocusInput({ id, ...props }: FocusInputProps) {
  return (
    <div className="relative group">
      <input
        id={id}
        {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background
          text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300
          focus:border-emerald-500/60"
      />
      <div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0
          group-focus-within:opacity-100 transition-opacity duration-300
          shadow-[0_0_18px_rgba(52,211,153,0.18)]"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

  // ── Reset password mode ────────────────────────────────────────────────────
  if (mode === "reset") {
    return (
      <PageShell>
        <Image src="/full_logo.png" alt="nuBoF" width={160} height={140} className="mb-6" priority />

        <motion.div
          className="w-full rounded-2xl border border-border bg-card shadow-xl p-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground text-center mb-2">
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
              <FocusInput
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {info  && <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">{info}</p>}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(52,211,153,0.35)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500
                text-white font-semibold text-base transition-colors duration-200
                disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </motion.button>
          </form>

          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
          >
            ← Back to log in
          </button>
        </motion.div>

        <p className="text-sm text-muted-foreground text-center tracking-wide mt-6">
          Syncing your Body&apos;s Fuel with Precision Nutrition.
        </p>
      </PageShell>
    );
  }

  // ── Login / signup mode ────────────────────────────────────────────────────
  return (
    <PageShell>
      <Image src="/full_logo.png" alt="nuBoF" width={200} height={120} className="mb-6" priority />

      <motion.div
        className="w-full rounded-2xl border border-border bg-card shadow-xl p-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-card-foreground text-center mb-6">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>

        {/* Segmented control */}
        <div className="flex rounded-lg bg-muted p-1 mb-6">
          {(["login", "signup"] as const).map((m) => (
            <motion.button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </motion.button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <FocusInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
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
            <FocusInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
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

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(52,211,153,0.35)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500
              text-white font-semibold text-base transition-colors duration-200
              disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </motion.button>
        </form>
      </motion.div>

      <p className="text-sm text-muted-foreground text-center tracking-wide mt-6">
        Syncing your Body&apos;s Fuel with Precision Nutrition.
      </p>
    </PageShell>
  );
}
