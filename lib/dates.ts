/**
 * Shared date utilities.
 * All functions work in the user's LOCAL timezone to match how food logs are stored
 * (which also use en-CA locale to produce YYYY-MM-DD in local time).
 */

/** YYYY-MM-DD string for a date N days ago (0 = today). */
export function dateStrDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-CA");
}

/** YYYY-MM-DD string for today. */
export function todayDateStr(): string {
  return dateStrDaysAgo(0);
}

/**
 * Returns the last `n` days as YYYY-MM-DD strings, today first.
 * e.g. lastNDays(3) → ["2024-11-15", "2024-11-14", "2024-11-13"]
 */
export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => dateStrDaysAgo(i));
}

/** Human-readable heading for the selected day (e.g. "Today", "Yesterday", "Mon, Nov 11"). */
export function formatDateHeading(dateStr: string): string {
  // Force midnight local time to avoid off-by-one from UTC conversion
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const t = d.getTime();
  if (t === today.getTime()) return "Today";
  if (t === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Three-letter weekday for date strip cells (Mon, Tue, …). */
export function getDayAbbrev(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

/** Numeric day of month (1–31). */
export function getDayOfMonth(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDate();
}

/** Three-letter month abbreviation (Jan, Feb, …). */
export function getMonthAbbrev(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { month: "short" });
}
