import type { BadgesSection } from "./sections/badges";
import type { TimelineSection } from "./sections/timeline";

/** One block of a tab, built by a section function such as `timeline()`. */
export type Section = BadgesSection | TimelineSection;

/**
 * A tab on the timelines page: what it's called and the sections it shows,
 * top to bottom. Each tab lives in lib/tabs/<slug>/ as a tab.ts (this) and
 * its JSON data, and is listed in lib/tabs/registry.ts.
 */
export type Tab = {
  /** The tab's URL is /timelines/<slug>. */
  slug: string;
  /** The tab's name in the tab bar. */
  label: string;
  /** For the browser tab title and search results. */
  title: string;
  description: string;
  sections: Section[];
};

/** Declares a tab; it only exists so tab files read as config. */
export function defineTab(tab: Tab): Tab {
  return tab;
}
