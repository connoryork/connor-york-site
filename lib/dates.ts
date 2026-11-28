// Dates are ISO "YYYY-MM-DD" strings. Day numbers count days since the Unix
// epoch in UTC, so date math never trips over time zones or DST.
const MS_PER_DAY = 86_400_000;

export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

export function isoFromDay(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Today's date in the viewer's own time zone. */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Days from `start` to `end`, or to `today` while still ongoing. */
export function daysBetween(start: string, end: string | null, today: string): number {
  return dayNumber(end ?? today) - dayNumber(start);
}

/**
 * The latest of some dates: a stand-in for today where today can't be known,
 * such as while a page is prerendered (prerendered pages can't read the clock).
 */
export function latestDate(dates: string[]): string {
  return dates.reduce((a, b) => (a > b ? a : b));
}
