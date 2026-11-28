import { notFound } from "next/navigation";
import { loadTab, type Tab } from "./tab";
import work from "./work/tab.json";

/** Every tab, in tab-bar order. To add a tab, add it here. */
export const tabs: Tab[] = [loadTab("work", work)];

/** The tab for a URL slug; a slug with no tab is a 404. */
export function findTab(slug: string): Tab {
  return tabs.find((tab) => tab.slug === slug) ?? notFound();
}
