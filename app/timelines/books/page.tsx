import type { Metadata } from "next";
import BookLog from "@/lib/book-log/BookLog";

export const metadata: Metadata = {
  title: "Books - Timelines - Connor York",
  description: "Every book I've read, as a git graph and pixel charts.",
};

export default function BooksPage() {
  return <BookLog />;
}
