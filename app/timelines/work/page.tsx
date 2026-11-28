import type { Metadata } from "next";
import WorkLog from "@/lib/work/WorkLog";

export const metadata: Metadata = {
  title: "Work - Timelines - Connor York",
  description: "My work experience, as a git graph.",
};

export default function WorkPage() {
  return <WorkLog />;
}
