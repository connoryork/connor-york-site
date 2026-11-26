import { Category } from "./categories";

export type Book = {
  title: string;
  author: string;
  categories: Category[];
  /** 1 to 5, or null if not rated. */
  rating: 1 | 2 | 3 | 4 | 5 | null;
  /** ISO date, YYYY-MM-DD. */
  began: string;
  /** ISO date, or null while still reading. */
  completed: string | null;
  pages: number;
};

// The reading log. To add a book, add an entry; order doesn't matter.
export const books: Book[] = [
  {
    title:
      "Theology of the Body for Beginners: Rediscovering the Meaning of Life, Love, Sex, and Gender",
    author: "Christopher West",
    categories: [Category.Theology],
    rating: 4,
    began: "2025-09-11",
    completed: "2026-01-19",
    pages: 206,
  },
  {
    title:
      "The Genius Life: Heal Your Mind, Strengthen Your Body, and Become Extraordinary",
    author: "Max Lugavere",
    categories: [Category.Health],
    rating: 4,
    began: "2025-12-25",
    completed: "2026-02-15",
    pages: 226,
  },
  {
    title: "Atlas Shrugged",
    author: "Ayn Rand",
    categories: [Category.Philosophical],
    rating: null,
    began: "2026-02-15",
    completed: null,
    pages: 1168,
  },
  {
    title: "The First Crusade",
    author: "Steven Runciman",
    categories: [Category.Medieval],
    rating: 4,
    began: "2026-04-27",
    completed: "2026-06-10",
    pages: 192,
  },
  {
    title: "Charismania",
    author: "Kennedy Hall",
    categories: [Category.Theology],
    rating: null,
    began: "2026-06-10",
    completed: "2026-07-19",
    pages: 157,
  },
  {
    title: "Infiltration: The Plot to Destroy the Church from Within",
    author: "Dr. Taylor Marshall",
    categories: [Category.Religion, Category.History],
    rating: 4,
    began: "2026-06-18",
    completed: "2026-07-10",
    pages: 300,
  },
  {
    title: "Murder on the Orient Express",
    author: "Agatha Christie",
    categories: [Category.Mystery],
    rating: null,
    began: "2026-07-26",
    completed: "2026-08-21",
    pages: 212,
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    categories: [Category.Fantasy],
    rating: 3,
    began: "2026-08-08",
    completed: "2026-08-22",
    pages: 309,
  },
];
