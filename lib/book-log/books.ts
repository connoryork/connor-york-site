import { z } from "zod";
import { Category } from "./categories";
import booksJson from "./books.json";

// The reading log lives in books.json; to add a book, add an entry there
// (order doesn't matter). This schema is the single source of truth for its
// shape: it checks the file when the site builds, so a typo fails the build
// instead of breaking the page, and it gives us the Book type via z.infer.

const isoDate = z.iso.date(); // YYYY-MM-DD

const bookSchema = z
  .object({
    title: z.string().min(1),
    author: z.string().min(1),
    categories: z.array(z.enum(Object.values(Category))).min(1),
    /** 1 to 5, or null if not rated. */
    rating: z.number().int().min(1).max(5).nullable(),
    began: isoDate,
    /** null while still reading. */
    completed: isoDate.nullable(),
    pages: z.number().int().positive(),
  })
  .refine((b) => b.completed === null || b.completed >= b.began, {
    message: "completed is before began",
    path: ["completed"],
  });

export type Book = z.infer<typeof bookSchema>;

function parseBooks(json: unknown): Book[] {
  const result = z.array(bookSchema).safeParse(json);
  if (!result.success) {
    throw new Error(`lib/book-log/books.json is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const books = parseBooks(booksJson);
