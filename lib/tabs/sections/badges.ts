import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { BadgeData } from "@/lib/pixel/BadgeShelf";
import { hexColor, isoMonth } from "@/lib/schemas";

/**
 * One badge: its name, a color for its disc, a
 * logo (a pixel-art image in public/logos/, made with `npm run
 * pixelate-logo`) and the month it was earned. Any other fields are allowed
 * and show up in the badge's hover card.
 */
export const badgeSchema = z.looseObject({
  name: z.string().min(1),
  color: hexColor,
  logo: z
    .string()
    .refine((file) => existsSync(path.join(process.cwd(), "public/logos", file)), "no such file in public/logos/"),
  earned: isoMonth,
});

/** A badges section in a tab.json. */
export const badgesSectionSchema = z.object({
  type: z.literal("badges"),
  /** The shelf's heading. */
  title: z.string().min(1).default("BADGES EARNED"),
  items: z.array(badgeSchema),
});

export type BadgesSection = { type: "badges"; title: string; badges: BadgeData[] };

/** A shelf of achievement badges, most recently earned first. */
export function badges({ title, items }: z.infer<typeof badgesSectionSchema>): BadgesSection {
  return {
    type: "badges",
    title,
    badges: items
      .toSorted((a, b) => b.earned.localeCompare(a.earned))
      .map((badge) => ({
        name: badge.name,
        caption: `EARNED ${badge.earned.slice(0, 4)}`,
        color: badge.color,
        logo: `/logos/${badge.logo}`,
        data: badge,
      })),
  };
}
