import { NextRequest, NextResponse } from "next/server";
import type { UsdaFood } from "@/types";
import {
  buildUsdaQueryProfile,
  rankUsdaFoods,
  USDA_BRANDED_DATA_TYPES,
  USDA_GENERIC_DATA_TYPES,
} from "@/lib/usda-search";

/**
 * GET /api/food/search?q=<query>
 *
 * Server-side USDA FoodData Central search orchestrator.
 * Keeps USDA_API_KEY out of client-side bundles.
 *
 * Runs a few query variants against generic USDA datasets
 * (Foundation + SR Legacy) and Branded foods separately,
 * then de-duplicates and applies local relevance scoring.
 */

// Simple per-IP rate limiter: 20 requests per minute.
// Per-process only — swap for Upstash Redis on multi-instance / edge deployments.
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1/foods/search";

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

async function searchUsdaFoods(
  apiKey: string,
  query: string,
  dataType: readonly string[],
): Promise<UsdaFood[]> {
  const res = await fetch(`${USDA_API_BASE}?api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      dataType,
      pageSize: dataType.includes("Branded") ? 20 : 25,
      pageNumber: 1,
    }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { foods?: UsdaFood[] };
  return data.foods ?? [];
}

export async function GET(request: NextRequest) {
  const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim();
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const query = request.nextUrl.searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    console.error("USDA_API_KEY is not set on the server.");
    return NextResponse.json({ error: "Server not configured for food search." }, { status: 500 });
  }

  try {
    const profile = buildUsdaQueryProfile(query);
    const genericVariants = profile.variants.length > 0 ? profile.variants : [query.trim()];
    const brandedVariants = profile.likelyBranded
      ? genericVariants
      : genericVariants.slice(0, Math.min(2, genericVariants.length));

    const searchTasks = [
      ...genericVariants.map((variant) =>
        searchUsdaFoods(apiKey, variant, USDA_GENERIC_DATA_TYPES),
      ),
      ...brandedVariants.map((variant) =>
        searchUsdaFoods(apiKey, variant, USDA_BRANDED_DATA_TYPES),
      ),
    ];

    const searchResults = await Promise.all(searchTasks);
    const dedupedFoods = new Map<number, UsdaFood>();

    for (const foods of searchResults) {
      for (const food of foods) {
        if (!dedupedFoods.has(food.fdcId)) {
          dedupedFoods.set(food.fdcId, food);
        }
      }
    }

    const rankedFoods = rankUsdaFoods([...dedupedFoods.values()], profile).map(
      ({ food, score, reasons }) => ({
        ...food,
        matchScore: score,
        matchReasons: reasons,
      }),
    );

    return NextResponse.json({
      foods: rankedFoods,
      queryVariants: profile.variants,
      likelyBranded: profile.likelyBranded,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reach USDA FoodData Central API.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
