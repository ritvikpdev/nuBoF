import type { ParsedFood } from "@/types";

const SOURCE_STYLES: Record<string, string> = {
  Foundation: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "SR Legacy": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Branded: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

interface FoodSourceBadgeProps {
  food: ParsedFood;
  isCustom?: boolean;
}

export function FoodSourceBadge({ food, isCustom }: FoodSourceBadgeProps) {
  if (isCustom) {
    return (
      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
        Custom
      </span>
    );
  }

  if (!food.dataType) return null;

  return (
    <span
      className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
        SOURCE_STYLES[food.dataType] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {food.dataType}
    </span>
  );
}
