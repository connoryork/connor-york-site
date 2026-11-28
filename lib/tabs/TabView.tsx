import BadgeShelf from "@/lib/pixel/BadgeShelf";
import Timeline from "@/lib/timeline/Timeline";
import type { Section, Tab } from "./defineTab";

/** Renders a tab's sections, top to bottom. */
export default function TabView({ tab }: { tab: Tab }) {
  return tab.sections.map((section, i) => <SectionView key={i} section={section} />);
}

function SectionView({ section }: { section: Section }) {
  switch (section.kind) {
    case "badges":
      return <BadgeShelf title={section.title} badges={section.badges} />;
    case "timeline":
      return (
        <Timeline
          entries={section.entries}
          fallbackToday={section.fallbackToday}
          ongoingLabel={section.ongoingLabel}
          label={section.name}
        />
      );
  }
}
