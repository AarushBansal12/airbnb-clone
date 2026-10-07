// Formatting + date helpers. Dates travel as "YYYY-MM-DD" strings and are parsed
// as *local* dates so a calendar day never shifts because of time zones.

export const formatPrice = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export const todayISO = () => toISODate(new Date());

export function nightsBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

export function formatShortDate(s: string): string {
  return parseISODate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(s: string): string {
  return parseISODate(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** "Nov 12 – 17" or "Nov 28 – Dec 2", the way Airbnb prints a stay. */
export function formatRange(a: string, b: string): string {
  const da = parseISODate(a);
  const db = parseISODate(b);
  const sameMonth = da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear();
  const left = da.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const right = sameMonth ? String(db.getDate()) : db.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${left} – ${right}`;
}

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;

export function yearsSince(iso: string): number {
  const years = (Date.now() - new Date(iso).getTime()) / (365.25 * 86_400_000);
  return Math.max(1, Math.floor(years));
}

/** Is the night starting on `day` covered by any booked range? (ranges are [check_in, check_out)) */
export function isNightBooked(day: string, ranges: { check_in: string; check_out: string }[]) {
  return ranges.some((r) => r.check_in <= day && day < r.check_out);
}

/** First booked check-in strictly after `start` — the latest possible checkout. */
export function nextBlockedDate(start: string, ranges: { check_in: string; check_out: string }[]): string | null {
  const later = ranges.filter((r) => r.check_in > start).map((r) => r.check_in).sort();
  return later[0] ?? null;
}

export function rangeIsFree(a: string, b: string, ranges: { check_in: string; check_out: string }[]) {
  return !ranges.some((r) => r.check_in < b && a < r.check_out);
}
