import { z } from "zod";
import { dayNumber, isoFromDay } from "@/lib/dates";
import { parseData } from "@/lib/parseData";
import { hexColor, isoMonth } from "@/lib/schemas";
import { defineTab } from "../defineTab";
import { badgeSchema, badges } from "../sections/badges";
import { timeline } from "../sections/timeline";
import json from "./data.json";

// My jobs, internships and schooling. data.json holds:
// - badges: the Badges Earned shelf (see badgeSchema).
// - roles: one per role or degree (a promotion is a new role). Jobs and
//   internships need a title and team, schools a degree; any other fields
//   show up in the hover card.
// - colors: each org's color, for its roles' timeline branches.

const common = {
  org: z.string().min(1),
  location: z.string().min(1),
  start: isoMonth,
  /** null while current. */
  end: isoMonth.nullable(),
};

const roleSchema = z
  .discriminatedUnion("kind", [
    z.looseObject({ kind: z.enum(["job", "internship"]), title: z.string().min(1), team: z.string().min(1), ...common }),
    z.looseObject({ kind: z.literal("school"), degree: z.string().min(1), ...common }),
  ])
  .refine((r) => r.end === null || r.end >= r.start, { message: "end is before start", path: ["end"] });

const dataSchema = z
  .object({
    colors: z.record(z.string(), hexColor),
    badges: z.array(badgeSchema),
    roles: z.array(roleSchema),
  })
  .superRefine((data, ctx) => {
    data.roles.forEach((role, i) => {
      if (!(role.org in data.colors)) {
        ctx.addIssue({ code: "custom", message: `${role.org} has no color in colors`, path: ["roles", i, "org"] });
      }
    });
  });

const data = parseData(dataSchema, json, "lib/tabs/work/data.json");

export default defineTab({
  slug: "work",
  label: "WORK",
  title: "Work",
  description: "My work experience, as a git graph.",
  sections: [
    badges(data.badges),
    timeline(data.roles, {
      name: "Work timeline",
      // Roles are dated by month. One starts on the 1st of its first month
      // and ends the day before the 1st of its end month, so a promotion's
      // old role merges back just before the new one branches out.
      start: (role) => `${role.start}-01`,
      end: (role) => (role.end === null ? null : isoFromDay(dayNumber(`${role.end}-01`) - 1)),
      label: (role) => `${role.org} ${role.kind === "school" ? role.degree : role.team}`,
      color: (role) => data.colors[role.org],
      ongoingLabel: "CURRENT",
    }),
  ],
});
