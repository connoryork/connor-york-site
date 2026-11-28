import { notFound } from "next/navigation";
import type { Tab } from "./defineTab";
import work from "./work/tab";

/** Every data-driven tab, in tab-bar order. To add a tab, add it here. */
export const tabs: Tab[] = [work];

/** The tab for a URL slug; a slug with no tab is a 404. */
export function findTab(slug: string): Tab {
  return tabs.find((tab) => tab.slug === slug) ?? notFound();
}
