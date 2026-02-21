import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/food/search?q=<query>
 *
 * Server-side proxy for the USDA FoodData Central API.
 * Keeps USDA_API_KEY out of client-side bundles.
 *
 * Searches across Foundation, SR Legacy, and Branded data types to return
 * a broad set of whole and packaged food results (pageSize: 20).
 */

// Simple per-IP rate limiter: 20 requests per minute.
// Per-process only — swap for Upstash Redis on multi-instance / edge deployments.
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

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
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

    const res = await fetch(url.toString(), {
      // Cache identical queries for 5 minutes in Next.js data cache
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `USDA API error: ${res.status} ${res.statusText}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach USDA FoodData Central API." }, { status: 502 });
  }
}
