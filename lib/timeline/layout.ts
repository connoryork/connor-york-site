import { dayNumber, isoFromDay } from "@/lib/dates";

// Geometry for the git-style timeline. Time runs down the page, newest at the
// top, one calendar day per DAY pixels. The white baseline is a vertical line
// at BASE_X; each entry branches right into a lane when it starts and merges
// back when it ends. Everything snaps to a 2px "art pixel" grid.

/** One thing on the timeline: a book, a job, a school. */
export type TimelineEntry = {
  /** ISO dates; `end` is null while ongoing. */
  start: string;
  end: string | null;
  label: string;
  color: string;
  /** Shown as JSON in the entry's hover card. */
  data: Record<string, unknown>;
};

export const PIXEL = 2;
export const DAY = 2 * PIXEL;
export const LINE = 2 * PIXEL;
export const NODE = 4 * PIXEL;
const LANE_GAP = 12 * PIXEL;
const BASE_X = 30 * PIXEL;
const PAD_TOP = 16 * PIXEL;
const PAD_BOTTOM = 16 * PIXEL;
const LABEL_GAP = 7 * PIXEL;
const LABEL_CHARS = 36;
const CHAR_WIDTH = 8; // the pixel font at 8px is 8px per character

export type Branch = {
  entry: TimelineEntry;
  /** The entry's position in the list it came from. */
  index: number;
  lane: number;
  x: number;
  /** y of the start (lower) and end (upper) of the branch. */
  yStart: number;
  yEnd: number;
  ongoing: boolean;
  label: string;
  labelY: number;
};

export type Tick = { y: number; text: string; year: boolean };

export type TimelineLayout = {
  width: number;
  height: number;
  baseX: number;
  labelX: number;
  laneRight: number;
  baseTop: number;
  baseBottom: number;
  branches: Branch[];
  ticks: Tick[];
};

const MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");

/**
 * Lays out `entries` from their earliest start up to `today`.
 * `ongoingLabel` marks entries with no end yet, e.g. "READING".
 */
export function layoutTimeline(
  entries: TimelineEntry[],
  today: string,
  ongoingLabel: string,
): TimelineLayout {
  const todayDay = dayNumber(today);
  const firstDay = Math.min(...entries.map((e) => dayNumber(e.start)));
  const y = (day: number) => PAD_TOP + (todayDay - day) * DAY;

  // Give each entry the leftmost lane that's free by the day it starts.
  // A lane frees up the day after its entry ends, so a branch never merges
  // and leaves at the same point.
  const order = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => dayNumber(a.entry.start) - dayNumber(b.entry.start));
  const laneFreeAfter: number[] = [];
  const branches: Branch[] = order.map(({ entry, index }) => {
    const start = dayNumber(entry.start);
    const end = entry.end ? dayNumber(entry.end) : todayDay;
    let lane = laneFreeAfter.findIndex((free) => free < start);
    if (lane === -1) lane = laneFreeAfter.length;
    laneFreeAfter[lane] = entry.end ? end : Infinity;
    const ongoing = entry.end === null;
    const label =
      (entry.label.length > LABEL_CHARS
        ? entry.label.slice(0, LABEL_CHARS - 1) + "…"
        : entry.label) + (ongoing ? ` (${ongoingLabel})` : "");
    return {
      entry,
      index,
      lane,
      x: BASE_X + (lane + 1) * LANE_GAP,
      yStart: y(start),
      yEnd: y(end),
      ongoing,
      label,
      labelY: 0,
    };
  });

  const lanes = laneFreeAfter.length;
  const laneRight = BASE_X + lanes * LANE_GAP;
  const labelX = laneRight + LANE_GAP;

  // Labels sit beside the top of each branch, nudged down so none overlap.
  let lastLabelY = -Infinity;
  for (const branch of [...branches].sort((a, b) => a.yEnd - b.yEnd)) {
    branch.labelY = Math.max(branch.yEnd, lastLabelY + LABEL_GAP);
    lastLabelY = branch.labelY;
  }

  // A tick at the start of each month; January shows the year.
  const ticks: Tick[] = [];
  const firstIso = isoFromDay(firstDay);
  let year = Number(firstIso.slice(0, 4));
  let month = Number(firstIso.slice(5, 7)); // the month after the first day's
  for (;;) {
    if (month === 12) {
      month = 0;
      year += 1;
    }
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const day = dayNumber(iso);
    if (day > todayDay) break;
    ticks.push({ y: y(day), text: month === 0 ? String(year) : MONTHS[month], year: month === 0 });
    month += 1;
  }

  const longestLabel = Math.max(...branches.map((b) => b.label.length));
  const baseBottom = y(firstDay) + PAD_BOTTOM / 2;
  return {
    width: labelX + longestLabel * CHAR_WIDTH + 4 * PIXEL,
    height: Math.max(baseBottom, lastLabelY) + PAD_BOTTOM,
    baseX: BASE_X,
    labelX,
    laneRight,
    baseTop: y(todayDay),
    baseBottom,
    branches,
    ticks,
  };
}
