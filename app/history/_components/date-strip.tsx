"use client";

import { useRef, useEffect } from "react";
import { lastNDays, getDayAbbrev, getDayOfMonth, todayDateStr } from "@/lib/dates";

interface Props {
  selected: string;
  onSelect: (dateStr: string) => void;
}

const DAYS_TO_SHOW = 14;

export function DateStrip({ selected, onSelect }: Props) {
  const days = lastNDays(DAYS_TO_SHOW); // today first
  const today = todayDateStr();

  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref map so we can scroll the selected cell into view
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Scroll selected into centre whenever it changes
  useEffect(() => {
    const el = cellRefs.current[selected];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selected]);

  return (
    <div className="relative">
      {/* Fade edges to hint at scrollability */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-muted/30 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-muted/30 to-transparent z-10" />

      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {days.map((dateStr) => {
          const isSelected = dateStr === selected;
          const isToday    = dateStr === today;
          const day        = getDayAbbrev(dateStr);
          const num        = getDayOfMonth(dateStr);

          return (
            <button
              key={dateStr}
              ref={(el) => { cellRefs.current[dateStr] = el; }}
              onClick={() => onSelect(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 w-12 py-2.5 rounded-2xl transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-white/80" : ""}`}>
                {day}
              </span>
              <span className={`text-base font-bold tabular-nums leading-none ${isSelected ? "text-white" : "text-foreground"}`}>
                {num}
              </span>
              {isToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground/60" : "bg-primary"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
