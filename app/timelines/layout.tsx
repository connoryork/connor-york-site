import PixelPage from "@/lib/pixel/PixelPage";

export default function TimelinesLayout({ children }: LayoutProps<"/timelines">) {
  return <PixelPage title="TIMELINES">{children}</PixelPage>;
}
