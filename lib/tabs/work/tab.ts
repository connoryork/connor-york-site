import { z } from "zod";
import { parseData } from "@/lib/parseData";
import { defineTab } from "../defineTab";
import { badgeSchema, badges } from "../sections/badges";
import { timeline, timelineItemSchema } from "../sections/timeline";
import json from "./data.json";

// My jobs, internships and schooling. data.json holds:
// - badges: the Badges Earned shelf (see badgeSchema).
// - timelineItems: one per role or degree; a promotion is a new item (see
//   timelineItemSchema).
// - ongoingLabel: marks the branch of a role that hasn't ended.

const dataSchema = z.object({
  ongoingLabel: z.string().min(1),
  badges: z.array(badgeSchema),
  timelineItems: z.array(timelineItemSchema),
});

const data = parseData(dataSchema, json, "lib/tabs/work/data.json");

export default defineTab({
  slug: "work",
  label: "WORK",
  title: "Work",
  description: "My work experience, as a git graph.",
  sections: [
    badges(data.badges),
    timeline(data.timelineItems, { name: "Work timeline", ongoingLabel: data.ongoingLabel }),
  ],
});
