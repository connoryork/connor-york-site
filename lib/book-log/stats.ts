import type { Book } from "./books";
import {
  Category,
  MAIN_CATEGORIES,
  blendColor,
  categoryColor,
  mainCategory,
} from "./categories";
import { daysBetween, yearOf } from "@/lib/dates";

/** Days from starting a book to finishing it, or to `today` while reading. */
export function daysReading(book: Book, today: string): number {
  return daysBetween(book.began, book.completed, today);
}

export function bookColor(book: Book): string {
  return blendColor(book.categories);
}

/** The title up to any subtitle, e.g. "Infiltration". */
export function shortTitle(book: Book): string {
  return book.title.split(":")[0].trim();
}

const average = (xs: number[]) =>
  xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;

// A row in a block chart: a label and the colored segments that fill it.
export type Segment = { value: number; color: string; title: string };
export type Row = { label: string; segments: Segment[]; note?: string };

function bookSegment(book: Book, value = 1): Segment {
  return { value, color: bookColor(book), title: book.title };
}

/** Every year from the first book started to the latest date, in order. */
function years(books: Book[], today: string): number[] {
  const first = Math.min(...books.map((b) => yearOf(b.began)));
  const last = yearOf(today);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

export function ratingStats(books: Book[]) {
  const rated = books.filter((b) => b.rating !== null);
  const rows: Row[] = [5, 4, 3, 2, 1].map((r) => {
    const matches = rated.filter((b) => b.rating === r);
    return {
      label: `${r} STAR`,
      segments: matches.map((b) => bookSegment(b)),
      note: String(matches.length),
    };
  });
  const unrated = books.filter((b) => b.rating === null);
  rows.push({
    label: "UNRATED",
    segments: unrated.map((b) => ({ ...bookSegment(b), color: "#5f574f" })),
    note: String(unrated.length),
  });
  return {
    average: average(rated.map((b) => b.rating!)),
    rated: rated.length,
    total: books.length,
    rows,
  };
}

/** Books per main category. A book counts once in each category it's in. */
export function categoryStats(books: Book[]) {
  const rows: Row[] = MAIN_CATEGORIES.map((main) => {
    const segments: Segment[] = [];
    for (const book of books) {
      // The book's most specific category under this main one, if any.
      const match = book.categories.find((c) => mainCategory(c) === main);
      if (match) {
        segments.push({
          value: 1,
          color: categoryColor(match),
          title: `${book.title} (${match})`,
        });
      }
    }
    return { label: main.toUpperCase(), segments, note: String(segments.length) };
  });
  const multi = books.filter(
    (b) => new Set(b.categories.map(mainCategory)).size > 1,
  ).length;
  return { rows, multi };
}

/** Sub-categories in use, for the legend. */
export function legend(): { main: Category; color: string; subs: { name: string; color: string }[] }[] {
  return MAIN_CATEGORIES.map((main) => ({
    main,
    color: categoryColor(main),
    subs: Object.values(Category)
      .filter((c) => c !== main && mainCategory(c) === main)
      .map((c) => ({ name: c.split("/")[1], color: categoryColor(c) })),
  }));
}

export function lengthStats(books: Book[]) {
  const sorted = [...books].sort((a, b) => b.pages - a.pages);
  return {
    average: average(books.map((b) => b.pages)),
    rows: sorted.map((b) => ({
      label: shortTitle(b),
      segments: [bookSegment(b, b.pages)],
      note: String(b.pages),
    })),
  };
}

/** Average days to finish, by the year each book was finished. */
export function daysPerYearStats(books: Book[], today: string) {
  const finished = books.filter((b) => b.completed !== null);
  const rows: Row[] = years(books, today).map((year) => {
    const done = finished.filter((b) => yearOf(b.completed!) === year);
    const avg = average(done.map((b) => daysReading(b, today)));
    return {
      label: String(year),
      segments: avg === null ? [] : [{ value: avg, color: "#29adff", title: `${done.length} books` }],
      note: avg === null ? "-" : `${Math.round(avg)} D`,
    };
  });
  return { rows, average: average(finished.map((b) => daysReading(b, today))) };
}

/** Pages of finished books, by the year each was finished. */
export function pagesPerYearStats(books: Book[], today: string) {
  const finished = books.filter((b) => b.completed !== null);
  const rows: Row[] = years(books, today).map((year) => {
    const done = finished.filter((b) => yearOf(b.completed!) === year);
    const total = done.reduce((sum, b) => sum + b.pages, 0);
    return {
      label: String(year),
      segments: done.map((b) => bookSegment(b, b.pages)),
      note: total === 0 ? "-" : total.toLocaleString("en-US"),
    };
  });
  return { rows, total: finished.reduce((sum, b) => sum + b.pages, 0) };
}
