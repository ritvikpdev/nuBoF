"use client";

/**
 * Re-exports useAuth from AuthProvider for convenience.
 * Prefer the more specific useUser() or useSession() hooks where possible.
 */
export { useAuth } from "@/components/providers/auth-provider";
