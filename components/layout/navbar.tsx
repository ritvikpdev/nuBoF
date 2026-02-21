"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Leaf, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Container } from "./container";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search",    label: "Search"    },
  { href: "/meals",     label: "Meals"     },
  { href: "/history",   label: "History"   },
] as const;

export function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, isLoading } = useAuth();

  if (pathname.startsWith("/auth") || pathname.startsWith("/onboarding")) return null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
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
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Leaf className="size-4 text-primary" />
            </span>
            <span className="tracking-tight">NutriTrack</span>
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
                <>
                  <span className="hidden text-xs text-muted-foreground sm:block max-w-[9rem] truncate">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Log out"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </>
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
