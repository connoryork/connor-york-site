import type { Metadata } from "next";
import { findTab, tabs } from "@/lib/tabs/registry";
import TabView from "@/lib/tabs/TabView";

// Every tab in the registry is prerendered at build time.
export function generateStaticParams() {
  return tabs.map((tab) => ({ tab: tab.slug }));
}

export async function generateMetadata({ params }: PageProps<"/timelines/[tab]">): Promise<Metadata> {
  const tab = findTab((await params).tab);
  return { title: `${tab.title} - Timelines - Connor York`, description: tab.description };
}

export default async function TabPage({ params }: PageProps<"/timelines/[tab]">) {
  return <TabView tab={findTab((await params).tab)} />;
}
