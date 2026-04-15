"use client";

import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { TrashIcon } from "@/components/ui/icons";
import { MACRO_COLORS } from "@/lib/constants";
import type { FoodLogEntry } from "@/types";

const COMPACT_MACROS = MACRO_COLORS.slice(0, 3);

interface FoodLogRowProps {
  log: FoodLogEntry;
  index: number;
  onDelete?: (logId: string) => void;
  deletingId?: string;
  /** Extra action buttons rendered after the food info (e.g. move-to-split). */
  actions?: React.ReactNode;
}

export function FoodLogRow({
  log,
  index,
  onDelete,
  deletingId,
  actions,
}: FoodLogRowProps) {
  const id = log.id ?? String(index);

  return (
    <motion.li
      key={id}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors"
    >
      <div className="flex-shrink-0 w-12 text-right">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {Math.round(Number(log.calories ?? 0))}
        </span>
        <span className="text-[10px] text-muted-foreground block -mt-0.5">kcal</span>
      </div>

      <div className="w-px h-6 bg-border flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground leading-snug truncate">
          {log.food_name ?? "Unknown food"}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {COMPACT_MACROS.map(({ key, label, color }) => (
            <span key={key} className="text-[11px] text-muted-foreground tabular-nums">
              <span className={`font-semibold ${color}`}>{label}</span>{" "}
              {Math.round(Number(log[key] ?? 0))}g
            </span>
          ))}
        </div>
      </div>

      {actions}

      {log.id && onDelete && (
        <button
          onClick={() => onDelete(log.id!)}
          disabled={deletingId === log.id}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-40 rounded-lg hover:bg-destructive/10 transition-all cursor-pointer"
          aria-label={`Remove ${log.food_name ?? "food"}`}
        >
          {deletingId === log.id ? (
            <Spinner className="w-3.5 h-3.5" />
          ) : (
            <TrashIcon />
          )}
        </button>
      )}
    </motion.li>
  );
}
