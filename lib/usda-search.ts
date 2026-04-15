import type { UsdaFood } from "@/types";

export const USDA_GENERIC_DATA_TYPES = ["Foundation", "SR Legacy"] as const;
export const USDA_BRANDED_DATA_TYPES = ["Branded"] as const;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "without",
]);

const DESCRIPTOR_TERMS = new Set([
  "all",
  "baby",
  "baked",
  "black",
  "blue",
  "boiled",
  "boneless",
  "breaded",
  "broiled",
  "brown",
  "canned",
  "cooked",
  "crushed",
  "cubed",
  "diced",
  "dried",
  "extra",
  "fat",
  "fatfree",
  "fat-free",
  "fresh",
  "fried",
  "frozen",
  "grilled",
  "ground",
  "lean",
  "light",
  "low",
  "lowfat",
  "low-fat",
  "mild",
  "mini",
  "natural",
  "nonfat",
  "non-fat",
  "plain",
  "raw",
  "reduced",
  "roasted",
  "salted",
  "seasoned",
  "sharp",
  "shredded",
  "skinless",
  "skim",
  "sliced",
  "smoked",
  "soft",
  "sweetened",
  "thin",
  "traditional",
  "trimmed",
  "uncooked",
  "unsalted",
  "unsweetened",
  "whole",
  "white",
]);

const BRANDED_QUERY_HINTS = new Set([
  "bar",
  "bites",
  "candy",
  "capsule",
  "cereal",
  "chips",
  "cookie",
  "cookies",
  "cracker",
  "crackers",
  "drink",
  "dressing",
  "gum",
  "ketchup",
  "nuggets",
  "pizza",
  "powder",
  "pretzel",
  "protein",
  "sauce",
  "shake",
  "snack",
  "soda",
  "supplement",
  "wrap",
]);

const DATA_TYPE_PRIORITY: Record<string, number> = {
  Foundation: 3,
  "SR Legacy": 2,
  Branded: 1,
};

export interface UsdaSearchQueryProfile {
  originalQuery: string;
  normalizedQuery: string;
  tokens: string[];
  coreTokens: string[];
  variants: string[];
  likelyBranded: boolean;
}

export interface RankedUsdaFood {
  food: UsdaFood;
  score: number;
  reasons: string[];
}

export function normalizeUsdaText(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[()"'`]/g, " ")
    .replace(/[\/,+]/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeUsdaText(input: string): string[] {
  return normalizeUsdaText(input)
    .split(" ")
    .filter(Boolean);
}

function uniqueTokens(tokens: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    deduped.push(token);
  }

  return deduped;
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const query of queries) {
    const key = normalizeUsdaText(query);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(query.trim());
  }

  return deduped;
}

function buildRelaxedVariant(coreTokens: string[], allTokens: string[]): string | null {
  if (coreTokens.length >= 2) return coreTokens.slice(0, 2).join(" ");
  if (allTokens.length >= 2) return allTokens.slice(-2).join(" ");
  if (allTokens.length === 1) return allTokens[0];
  return null;
}

export function buildUsdaQueryProfile(query: string): UsdaSearchQueryProfile {
  const originalQuery = query.trim();
  const tokens = uniqueTokens(
    tokenizeUsdaText(originalQuery).filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
  const coreTokens = tokens.filter((token) => !DESCRIPTOR_TERMS.has(token));

  const variants = uniqueQueries([
    originalQuery,
    tokens.join(" "),
    coreTokens.join(" "),
    buildRelaxedVariant(coreTokens, tokens) ?? "",
  ].filter(Boolean));

  const likelyBranded =
    /\d/.test(originalQuery) || tokens.some((token) => BRANDED_QUERY_HINTS.has(token));

  return {
    originalQuery,
    normalizedQuery: tokens.join(" "),
    tokens,
    coreTokens,
    variants: variants.slice(0, 3),
    likelyBranded,
  };
}

function phraseIncludes(text: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${text} `.includes(` ${phrase} `);
}

function countTokenHits(tokens: string[], text: string): number {
  return tokens.filter((token) => phraseIncludes(text, token)).length;
}

function getSourceBonus(dataType: string | undefined, likelyBranded: boolean): number {
  if (dataType === "Branded") return likelyBranded ? 18 : 4;
  if (dataType === "Foundation") return likelyBranded ? 8 : 24;
  if (dataType === "SR Legacy") return likelyBranded ? 6 : 16;
  return 0;
}

export function rankUsdaFoods(
  foods: UsdaFood[],
  profile: UsdaSearchQueryProfile,
): RankedUsdaFood[] {
  return foods
    .map((food) => {
      const description = String(food.description ?? "");
      const brand = String(food.brandOwner ?? food.brandName ?? "");
      const searchableDescription = normalizeUsdaText(description.replace(/,/g, " "));
      const searchableBrand = normalizeUsdaText(brand);
      const searchableCombined = `${searchableBrand} ${searchableDescription}`.trim();
      const reasons: string[] = [];

      let score = 0;

      if (description.trim().toLowerCase() === profile.originalQuery.toLowerCase()) {
        score += 90;
        reasons.push("exact_description");
      }

      if (profile.normalizedQuery && searchableDescription === profile.normalizedQuery) {
        score += 65;
        reasons.push("normalized_description");
      }

      if (profile.normalizedQuery && phraseIncludes(searchableDescription, profile.normalizedQuery)) {
        score += 50;
        reasons.push("contains_full_phrase");
      }

      const tokenMatches = countTokenHits(profile.tokens, searchableCombined);
      if (profile.tokens.length > 0 && tokenMatches === profile.tokens.length) {
        score += 40;
        reasons.push("full_token_coverage");
      } else {
        score += tokenMatches * 8;
      }

      const coreTokenMatches = countTokenHits(profile.coreTokens, searchableDescription);
      if (profile.coreTokens.length > 0 && coreTokenMatches === profile.coreTokens.length) {
        score += 28;
        reasons.push("core_tokens_match");
      } else {
        score += coreTokenMatches * 6;
      }

      const commaNormalizedDescription = normalizeUsdaText(description.replace(/,/g, " "));
      if (
        profile.coreTokens.length > 1 &&
        phraseIncludes(commaNormalizedDescription, profile.coreTokens.join(" "))
      ) {
        score += 24;
        reasons.push("hierarchy_descriptor_match");
      }

      if (profile.tokens.some((token) => phraseIncludes(searchableBrand, token))) {
        score += 20;
        reasons.push("brand_token_match");
      }

      const sourceBonus = getSourceBonus(food.dataType, profile.likelyBranded);
      if (sourceBonus > 0) {
        score += sourceBonus;
        reasons.push(`source_${food.dataType ?? "unknown"}`);
      }

      score += DATA_TYPE_PRIORITY[food.dataType ?? ""] ?? 0;

      return { food, score, reasons };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const typeDelta =
        (DATA_TYPE_PRIORITY[b.food.dataType ?? ""] ?? 0) -
        (DATA_TYPE_PRIORITY[a.food.dataType ?? ""] ?? 0);
      if (typeDelta !== 0) return typeDelta;

      return String(a.food.description ?? "").localeCompare(String(b.food.description ?? ""));
    });
}
