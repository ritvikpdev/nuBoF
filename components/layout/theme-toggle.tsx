"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * iOS-style sliding toggle switch.
 * - Uses resolvedTheme so system-preference is respected on first load.
 * - Clicking always toggles between "light" and "dark" (explicit user choice).
 * - Temporarily adds the `.transition-theme` CSS class to <html> so surfaces
 *   transition smoothly, then removes it to avoid interfering with animations.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  function toggle() {
    const isDark = resolvedTheme === "dark";
    // Enable color transitions just for this user-initiated change
    document.documentElement.classList.add("transition-theme");
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => {
      document.documentElement.classList.remove("transition-theme");
    }, 250);
  }

  // Render a stable-sized placeholder during SSR / before hydration
  if (!mounted) {
    return (
      <div
        className="h-6 w-11 rounded-full bg-muted flex-shrink-0"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full",
        "border-2 border-transparent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark ? "bg-primary/25" : "bg-muted",
      )}
    >
      {/* Sliding pill — travels 20px (w-11 44px − 2×border 0 − w-5 20px − 2×padding 4px) */}
      <motion.span
        className="pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm ring-0"
        animate={{ x: isDark ? "1.25rem" : "0rem" }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      >
        {/* Icon swaps inside the pill */}
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -40, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 40, scale: 0.6 }}
              transition={{ duration: 0.15 }}
            >
              <Moon className="size-3 text-primary" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 40, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -40, scale: 0.6 }}
              transition={{ duration: 0.15 }}
            >
              <Sun className="size-3 text-amber-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
