"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Utensils, Plus, Clock, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

// ─── Tab config ───────────────────────────────────────────────────────────────

const LEFT_TABS  = [
  { href: "/dashboard", label: "Home",    Icon: Home     },
  { href: "/meals",     label: "Meals",   Icon: Utensils },
] as const;

const RIGHT_TABS = [
  { href: "/history",   label: "History",  Icon: Clock    },
  { href: "/settings",  label: "Settings", Icon: Settings },
] as const;

const FAB_HREF = "/search";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Mobile-only bottom navigation bar (hidden on sm: breakpoints and above).
 * Layout: [Home] [Meals] [+Log FAB] [History]
 * The FAB routes to /search which is the full food-logging flow.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Hidden on auth/onboarding pages or before the user is confirmed
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    (!isLoading && !user)
  ) {
    return null;
  }

  const isFabActive = pathname.startsWith(FAB_HREF);

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-end h-16 px-1">

        {/* ── Left tabs ── */}
        {LEFT_TABS.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <TabItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              isActive={isActive}
            />
          );
        })}

        {/* ── Center FAB ── */}
        <div className="flex flex-col items-center justify-end flex-1 pb-1 gap-1">
          <Link
            href={FAB_HREF}
            aria-label="Log food"
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 active:scale-95",
              isFabActive
                ? "bg-primary/80 shadow-primary/20"
                : "bg-primary shadow-primary/30 hover:bg-primary/90",
            )}
          >
            <motion.div
              animate={{ rotate: isFabActive ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Plus className="size-6 text-primary-foreground" strokeWidth={2.5} />
            </motion.div>
          </Link>
          <span
            className={cn(
              "text-[10px] font-medium leading-none",
              isFabActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            Log Food
          </span>
        </div>

        {/* ── Right tabs ── */}
        {RIGHT_TABS.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <TabItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              isActive={isActive}
            />
          );
        })}

      </div>
    </nav>
  );
}

// ─── Tab item ─────────────────────────────────────────────────────────────────

interface TabItemProps {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean;
}

function TabItem({ href, label, Icon, isActive }: TabItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center justify-end pb-1 gap-1 flex-1 h-full pt-2 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <div className="relative flex items-center justify-center">
        <Icon
          className="size-[22px]"
          strokeWidth={isActive ? 2.2 : 1.7}
        />
        {/* Active dot indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
            />
          )}
        </AnimatePresence>
      </div>
      <span
        className={cn(
          "text-[10px] leading-none",
          isActive ? "font-semibold" : "font-medium",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
