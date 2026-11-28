import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ISO_MONTH } from "@/lib/dates";
import { parseData } from "@/lib/parseData";
import badgesJson from "./badges.json";

// The Badges Earned shelf lives in badges.json, one badge per entry,
// independent of the timeline's data. Each needs a name, a color for its
// disc, a logo (a pixel-art image in public/logos/, made with
// `npm run pixelate-logo`) and the month it was earned. Any other fields
// are allowed and show up in the badge's hover card.

const badgeSchema = z.looseObject({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "expected a #rrggbb color"),
  logo: z
    .string()
    .refine((file) => existsSync(path.join(process.cwd(), "public/logos", file)), "no such file in public/logos/"),
  earned: z.string().regex(ISO_MONTH, "expected YYYY-MM"),
});

export const badges = parseData(z.array(badgeSchema), badgesJson, "lib/work/badges.json");
