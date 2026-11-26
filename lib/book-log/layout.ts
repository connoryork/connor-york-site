import type { Book } from "./books";
import { bookColor, dayNumber, isoFromDay, shortTitle } from "./stats";

// Geometry for the git-style timeline. Time runs down the page, newest at the
// top, one calendar day per DAY pixels. The white baseline is a vertical line
// at BASE_X; each book branches right into a lane when it starts and merges
// back when it finishes. Everything snaps to a 2px "art pixel" grid.

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
  book: Book;
  index: number;
  color: string;
  lane: number;
  x: number;
  /** y of the start (lower) and end (upper) of the branch. */
  yStart: number;
  yEnd: number;
  reading: boolean;
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

export function layoutTimeline(books: Book[], today: string): TimelineLayout {
  const todayDay = dayNumber(today);
  const firstDay = Math.min(...books.map((b) => dayNumber(b.began)));
  const y = (day: number) => PAD_TOP + (todayDay - day) * DAY;

  // Give each book the leftmost lane that's free by the day it starts.
  // A lane frees up the day after its book finishes, so a branch never
  // merges and leaves at the same point.
  const order = books
    .map((book, index) => ({ book, index }))
    .sort((a, b) => dayNumber(a.book.began) - dayNumber(b.book.began));
  const laneFreeAfter: number[] = [];
  const branches: Branch[] = order.map(({ book, index }) => {
    const start = dayNumber(book.began);
    const end = book.completed ? dayNumber(book.completed) : todayDay;
    let lane = laneFreeAfter.findIndex((free) => free < start);
    if (lane === -1) lane = laneFreeAfter.length;
    laneFreeAfter[lane] = book.completed ? end : Infinity;
    const title = shortTitle(book);
    const reading = book.completed === null;
    const label =
      (title.length > LABEL_CHARS ? title.slice(0, LABEL_CHARS - 1) + "…" : title) +
      (reading ? " (READING)" : "");
    return {
      book,
      index,
      color: bookColor(book),
      lane,
      x: BASE_X + (lane + 1) * LANE_GAP,
      yStart: y(start),
      yEnd: y(end),
      reading,
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
