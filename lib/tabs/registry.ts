import { notFound } from "next/navigation";
import { loadTab, type Tab } from "./tab";

// Every lib/tabs/<slug>/tab.json is a tab. The bundler finds them when the
// site builds, sorted by folder name, which is also their tab-bar order.
const files = import.meta.glob<unknown>("./*/tab.json", { eager: true, import: "default" });

export const tabs: Tab[] = Object.entries(files).map(([file, json]) =>
  loadTab(file.split("/")[1], json),
);

/** The tab for a URL slug; a slug with no tab is a 404. */
export function findTab(slug: string): Tab {
  return tabs.find((tab) => tab.slug === slug) ?? notFound();
}
