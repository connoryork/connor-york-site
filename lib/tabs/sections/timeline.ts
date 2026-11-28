import { latestDate } from "@/lib/dates";
import type { TimelineEntry } from "@/lib/timeline/layout";

export type TimelineSection = {
  kind: "timeline";
  /** Names the timeline for screen readers. */
  name: string;
  entries: TimelineEntry[];
  fallbackToday: string;
  ongoingLabel: string;
};

/** How to draw one item of a tab's data as a timeline branch. */
export type TimelineMapping<T> = {
  /** ISO dates, "YYYY-MM-DD"; `end` is null while ongoing. */
  start: (item: T) => string;
  end: (item: T) => string | null;
  label: (item: T) => string;
  color: (item: T) => string;
  /** Marks ongoing branches, e.g. "CURRENT". */
  ongoingLabel: string;
  name: string;
};

/** A git-style timeline with a branch per item; hovering one shows the item as JSON. */
export function timeline<T extends Record<string, unknown>>(items: T[], map: TimelineMapping<T>): TimelineSection {
  const entries = items.map((item) => ({
    start: map.start(item),
    end: map.end(item),
    label: map.label(item),
    color: map.color(item),
    data: item,
  }));
  return {
    kind: "timeline",
    name: map.name,
    entries,
    // Prerendered pages can't read the clock, so the latest date in the data
    // stands in for today until the page loads.
    fallbackToday: latestDate(entries.flatMap((e) => [e.start, e.end ?? e.start])),
    ongoingLabel: map.ongoingLabel,
  };
}
