import PixelPage from "@/lib/pixel/PixelPage";
import PixelTabs from "@/lib/pixel/PixelTabs";

const tabs = [
  { href: "/timelines/books", label: "BOOKS" },
  { href: "/timelines/work", label: "WORK" },
];

export default function TimelinesLayout({ children }: LayoutProps<"/timelines">) {
  return (
    <PixelPage title="TIMELINES" nav={<PixelTabs tabs={tabs} label="Timelines" />}>
      {children}
    </PixelPage>
  );
}
