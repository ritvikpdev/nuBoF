import type { ParsedFood } from "@/types";

export interface Measure {
  label:         string;
  gramsPerUnit:  number;
  /** Hint for the smart preset chip row. */
  presetType:    "weight" | "piece" | "volume";
}

// ─── Food-type detection ──────────────────────────────────────────────────────

export type FoodType = "fruit" | "liquid" | "meat" | "bread" | "default";

const FOOD_KEYWORDS: Record<FoodType, string[]> = {
  fruit: [
    "apple", "banana", "orange", "grape", "mango", "pear", "peach", "plum",
    "berry", "berries", "strawberry", "blueberry", "raspberry", "watermelon",
    "melon", "kiwi", "pineapple", "papaya", "fig", "date", "cherry", "apricot",
    "lemon", "lime", "grapefruit", "avocado",
  ],
  liquid: [
    "milk", "juice", "water", "coffee", "tea", "soda", "cola", "beer", "wine",
    "smoothie", "shake", "broth", "soup", "stock", "cream", "yogurt", "kefir",
    "drink", "beverage", "lemonade", "cider", "oil",
  ],
  meat: [
    "chicken", "beef", "pork", "lamb", "turkey", "fish", "salmon", "tuna",
    "shrimp", "prawn", "steak", "bacon", "ham", "sausage", "mince", "ground",
    "fillet", "breast", "thigh", "wing", "ribs", "duck", "venison", "crab",
    "lobster", "scallop", "sardine", "tilapia", "cod", "halibut", "trout",
  ],
  bread: [
    "bread", "toast", "bun", "roll", "bagel", "muffin", "croissant", "wrap",
    "pita", "tortilla", "naan", "flatbread", "biscuit", "cracker", "cereal",
    "granola", "oat", "rice cake",
  ],
  default: [],
};

export function detectFoodType(name: string): FoodType {
  const lower = name.toLowerCase();
  for (const type of ["fruit", "liquid", "meat", "bread"] as const) {
    if (FOOD_KEYWORDS[type].some((kw) => lower.includes(kw))) return type;
  }
  return "default";
}

// ─── Measure tables ───────────────────────────────────────────────────────────

export function getMeasures(food: ParsedFood): Measure[] {
  const serving = food.servingSize ?? 100;
  const foodType = detectFoodType(food.name);

  switch (foodType) {
    case "fruit":
      return [
        { label: "small",   gramsPerUnit: 150,    presetType: "piece" },
        { label: "medium",  gramsPerUnit: 182,    presetType: "piece" },
        { label: "large",   gramsPerUnit: 220,    presetType: "piece" },
        { label: "g",       gramsPerUnit: 1,      presetType: "weight" },
        { label: "oz",      gramsPerUnit: 28.35,  presetType: "weight" },
        { label: "serving", gramsPerUnit: serving, presetType: "piece" },
      ];

    case "liquid":
      return [
        { label: "ml",      gramsPerUnit: 1,      presetType: "volume" },
        { label: "fl oz",   gramsPerUnit: 29.57,  presetType: "volume" },
        { label: "cup",     gramsPerUnit: 240,    presetType: "volume" },
        { label: "glass",   gramsPerUnit: 300,    presetType: "volume" },
        { label: "serving", gramsPerUnit: serving, presetType: "volume" },
      ];

    case "meat":
      return [
        { label: "g",       gramsPerUnit: 1,      presetType: "weight" },
        { label: "oz",      gramsPerUnit: 28.35,  presetType: "weight" },
        { label: "piece",   gramsPerUnit: 100,    presetType: "piece" },
        { label: "serving", gramsPerUnit: serving, presetType: "piece" },
      ];

    case "bread":
      return [
        { label: "g",       gramsPerUnit: 1,      presetType: "weight" },
        { label: "oz",      gramsPerUnit: 28.35,  presetType: "weight" },
        { label: "slice",   gramsPerUnit: 28,     presetType: "piece" },
        { label: "serving", gramsPerUnit: serving, presetType: "piece" },
      ];

    default:
      return [
        { label: "serving", gramsPerUnit: serving, presetType: "piece" },
        { label: "g",       gramsPerUnit: 1,       presetType: "weight" },
        { label: "oz",      gramsPerUnit: 28.35,   presetType: "weight" },
      ];
  }
}

// ─── Preset chips by measure type ─────────────────────────────────────────────

export const WEIGHT_PRESETS  = [25, 50, 100, 200];
export const PIECE_PRESETS   = [0.5, 1, 2, 3];
export const VOLUME_PRESETS  = [100, 200, 250, 500];

export function getPresets(measure: Measure): number[] {
  switch (measure.presetType) {
    case "weight":  return WEIGHT_PRESETS;
    case "piece":   return PIECE_PRESETS;
    case "volume":  return VOLUME_PRESETS;
  }
}
