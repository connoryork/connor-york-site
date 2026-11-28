import { z } from "zod";
import { ISO_MONTH } from "@/lib/dates";
import { parseData } from "@/lib/parseData";
import experienceJson from "./experience.json";
import orgsJson from "./orgs.json";

// Work and school history lives in experience.json, one entry per role or
// degree (a promotion is a new entry). Each entry's org must be listed in
// orgs.json, which gives its timeline branches their color. Fields beyond
// the required ones are allowed and show up in the hover card.

const month = z.string().regex(ISO_MONTH, "expected YYYY-MM");

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
});

export type Role = z.infer<typeof roleSchema>;
export type Org = z.infer<typeof orgSchema>;

export const orgs = parseData(z.array(orgSchema), orgsJson, "lib/work/orgs.json");

export const roles = parseData(
  z.array(roleSchema).superRefine((list, ctx) => {
    list.forEach((role, i) => {
      if (!orgs.some((o) => o.name === role.org)) {
        ctx.addIssue({ code: "custom", message: `${role.org} isn't in orgs.json`, path: [i, "org"] });
      }
    });
  }),
  experienceJson,
  "lib/work/experience.json",
);

export function orgOf(role: Role): Org {
  return orgs.find((o) => o.name === role.org)!;
}
