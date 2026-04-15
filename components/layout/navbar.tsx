"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";
import { createClient } from "@/lib/supabase/client";
import { Container } from "./container";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search",    label: "Track Food" },
  { href: "/meals",     label: "Meals"     },
  { href: "/history",   label: "History"   },
] as const;

export function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, isLoading } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const displayName = profile?.name ?? user?.email?.split("@")[0] ?? null;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) return null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  function openDropdown() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(true);
  }

  function closeDropdown() {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 120);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <Container>
        <div className="flex h-14 sm:h-16 items-center justify-between">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-75"
          >
            <Image src="/full_logo.png" width={200} height={200} alt="nuBoF" className="rounded-full" />
          </Link>

          {/* ── Nav links (desktop only) + actions ── */}
          <nav className="flex items-center gap-1">

            {/* Nav links — hidden on mobile because BottomNav handles them */}
            <div className="hidden sm:flex items-center gap-1">
              {user &&
                NAV_LINKS.map(({ href, label }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
            </div>

            {/* Actions — always visible */}
            <div className="flex items-center gap-1.5 sm:ml-3 sm:pl-3 sm:border-l sm:border-border/60">
              <ThemeToggle />

              {!isLoading && user && (
                /* ── User dropdown ── */
                <div
                  className="relative hidden sm:block"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  {/* Trigger */}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer select-none"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    <span className="max-w-[9rem] truncate">
                      {displayName ?? user.email}
                    </span>
                    <motion.span
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="size-3.5" />
                    </motion.span>
                  </button>

                  {/* Dropdown panel */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        onMouseEnter={openDropdown}
                        onMouseLeave={closeDropdown}
                        className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50"
                        role="menu"
                      >
                        <Link
                          href="/settings"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors",
                            pathname.startsWith("/settings")
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <User className="size-4 flex-shrink-0" />
                          View Profile
                        </Link>

                        <div className="h-px bg-border/60 mx-2" />

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { setDropdownOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="size-4 flex-shrink-0" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!isLoading && !user && (
                <Button asChild size="sm" className="rounded-lg">
                  <Link href="/auth/login">Log In</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      </Container>
    </header>
  );
}
