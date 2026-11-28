import { z } from "zod";
import { dayNumber, isoFromDay, latestDate } from "@/lib/dates";
import { hexColor, isoDate, isoMonth } from "@/lib/schemas";
import type { TimelineEntry } from "@/lib/timeline/layout";

const dateOrMonth = z.union([isoDate, isoMonth], { error: "expected YYYY-MM-DD or YYYY-MM" });

/**
 * The shape of one timeline item in a tab's data: its branch's label and
 * color, and when it started and ended (null while ongoing), each as a day
 * or a month. Any other fields are allowed and show up in its hover card.
 *
 * A month runs from its 1st: an item starting "2024-01" starts January 1,
 * and one ending "2024-01" ends the day before, so an item that ends the
 * month the next one starts merges back just before the next branches out.
 */
export const timelineItemSchema = z
  .looseObject({
    label: z.string().min(1),
    color: hexColor,
    start: dateOrMonth,
    end: dateOrMonth.nullable(),
  })
  .refine((item) => item.end === null || startDate(item.end) >= startDate(item.start), {
    message: "end is before start",
    path: ["end"],
  });

export type TimelineItem = z.infer<typeof timelineItemSchema>;

export type TimelineSection = {
  kind: "timeline";
  /** Names the timeline for screen readers. */
  name: string;
  entries: TimelineEntry[];
  fallbackToday: string;
  ongoingLabel: string;
};

/**
 * A git-style timeline with a branch per item; hovering one shows the item as
 * JSON. `ongoingLabel` marks branches that haven't ended, e.g. "CURRENT".
 */
export function timeline(
  items: TimelineItem[],
  { name, ongoingLabel }: { name: string; ongoingLabel: string },
): TimelineSection {
  const entries = items.map((item) => ({
    start: startDate(item.start),
    end: item.end === null ? null : endDate(item.end),
    label: item.label,
    color: item.color,
    data: item,
  }));
  return {
    kind: "timeline",
    name,
    entries,
    // Prerendered pages can't read the clock, so the latest date in the data
    // stands in for today until the page loads.
    fallbackToday: latestDate(entries.flatMap((e) => [e.start, e.end ?? e.start])),
    ongoingLabel,
  };
}

const isMonth = (date: string) => date.length === 7;

function startDate(date: string): string {
  return isMonth(date) ? `${date}-01` : date;
}

function endDate(date: string): string {
  return isMonth(date) ? isoFromDay(dayNumber(`${date}-01`) - 1) : date;
}
