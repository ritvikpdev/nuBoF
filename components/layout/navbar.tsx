"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
                <>
                  <span className="hidden text-xs text-muted-foreground sm:block max-w-[9rem] truncate">
                    {displayName ?? user.email}
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
