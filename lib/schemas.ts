import { z } from "zod";

// Field schemas shared by the data files.

/** A month, "YYYY-MM". */
export const isoMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "expected YYYY-MM");

/** A day, "YYYY-MM-DD". */
export const isoDate = z.iso.date();

/** A color, "#rrggbb". */
export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "expected a #rrggbb color");
