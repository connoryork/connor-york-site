import PixelPage from "@/lib/pixel/PixelPage";
import PixelTabs from "@/lib/pixel/PixelTabs";
import { tabs } from "@/lib/tabs/registry";

const tabLinks = [
  { href: "/timelines/books", label: "BOOKS" },
  ...tabs.map((tab) => ({ href: `/timelines/${tab.slug}`, label: tab.label })),
];

export default function TimelinesLayout({ children }: LayoutProps<"/timelines">) {
  return (
    <PixelPage title="TIMELINES" nav={<PixelTabs tabs={tabLinks} label="Timelines" />}>
      {children}
    </PixelPage>
  );
}
