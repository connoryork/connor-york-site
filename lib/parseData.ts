import { z } from "zod";

/**
 * Checks a data file against its schema. A mistake throws when the site
 * builds, naming the file and what's wrong, instead of breaking the page.
 */
export function parseData<T>(schema: z.ZodType<T>, json: unknown, file: string): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
