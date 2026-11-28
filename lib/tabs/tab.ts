import { z } from "zod";
import { parseData } from "@/lib/parseData";
import { badges, badgesSectionSchema, type BadgesSection } from "./sections/badges";
import { timeline, timelineSectionSchema, type TimelineSection } from "./sections/timeline";

// A tab on the timelines page is a lib/tabs/<slug>/tab.json: its name, and
// the sections it shows, top to bottom. Each section's `type` picks its
// schema, from lib/tabs/sections/.

const tabFileSchema = z.object({
  /** The tab's name in the tab bar. */
  label: z.string().min(1),
  /** For the browser tab title and search results. */
  title: z.string().min(1),
  description: z.string().min(1),
  sections: z.array(z.discriminatedUnion("type", [badgesSectionSchema, timelineSectionSchema])).min(1),
});

/** One block of a tab, ready to render. */
export type Section = BadgesSection | TimelineSection;

export type Tab = Omit<z.infer<typeof tabFileSchema>, "sections"> & {
  /** The tab's URL is /timelines/<slug>. */
  slug: string;
  sections: Section[];
};

/** Checks a tab.json and builds its sections. */
export function loadTab(slug: string, json: unknown): Tab {
  const file = parseData(tabFileSchema, json, `lib/tabs/${slug}/tab.json`);
  return {
    ...file,
    slug,
    sections: file.sections.map((section) => {
      switch (section.type) {
        case "badges":
          return badges(section);
        case "timeline":
          return timeline(section);
      }
    }),
  };
}
