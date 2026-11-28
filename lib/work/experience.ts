import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import experienceJson from "./experience.json";
import orgsJson from "./orgs.json";

// Work and school history lives in experience.json, one entry per role or
// degree (a promotion is a new entry). Each entry's org must be listed in
// orgs.json, which gives it a color and a logo for its badge (a pixel-art
// image in public/logos/, made with scripts/pixelate-logo.mjs). These schemas check both files when the
// site builds, so a typo fails the build instead of breaking the page. Fields
// beyond the required ones are allowed and show up in the hover card.

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "expected YYYY-MM");

const common = {
  org: z.string().min(1),
  location: z.string().min(1),
  start: month,
  /** null while current. */
  end: month.nullable(),
};

const roleSchema = z
  .discriminatedUnion("kind", [
    z.looseObject({ kind: z.enum(["job", "internship"]), title: z.string().min(1), team: z.string().min(1), ...common }),
    z.looseObject({ kind: z.literal("school"), degree: z.string().min(1), ...common }),
  ])
  .refine((r) => r.end === null || r.end >= r.start, { message: "end is before start", path: ["end"] });

const orgSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "expected a #rrggbb color"),
  logo: z
    .string()
    .refine((file) => existsSync(path.join(process.cwd(), "public/logos", file)), "no such file in public/logos/"),
});

export type Role = z.infer<typeof roleSchema>;
export type Org = z.infer<typeof orgSchema>;

function parse<T>(schema: z.ZodType<T>, json: unknown, file: string): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`lib/work/${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const orgs = parse(z.array(orgSchema), orgsJson, "orgs.json");

export const roles = parse(
  z.array(roleSchema).superRefine((list, ctx) => {
    list.forEach((role, i) => {
      if (!orgs.some((o) => o.name === role.org)) {
        ctx.addIssue({ code: "custom", message: `${role.org} isn't in orgs.json`, path: [i, "org"] });
      }
    });
  }),
  experienceJson,
  "experience.json",
);

export function orgOf(role: Role): Org {
  return orgs.find((o) => o.name === role.org)!;
}
