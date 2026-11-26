import PixelPage from "@/lib/pixel/PixelPage";
import { latestDate } from "@/lib/timeline/dates";
import type { TimelineEntry } from "@/lib/timeline/layout";
import Timeline from "@/lib/timeline/Timeline";
import { books } from "./books";
import Charts from "./Charts";
import { bookColor, legend, shortTitle } from "./stats";
import styles from "./BookLog.module.css";

export default function BookLog() {
  // The page is prerendered, so it can't know today; the latest date in the
  // log stands in. The timeline swaps in the viewer's own today once it
  // loads, so the in-progress branch keeps growing.
  const today = latestDate(books.flatMap((b) => [b.began, b.completed ?? b.began]));
  const entries: TimelineEntry[] = books.map((book) => ({
    start: book.began,
    end: book.completed,
    label: shortTitle(book),
    color: bookColor(book),
    data: book,
  }));
  const years = books.map((b) => Number(b.began.slice(0, 4)));

  return (
    <PixelPage
      title="BOOK LOG"
      subtitle={`${books.length} BOOKS, ${Math.min(...years)}-${today.slice(0, 4)}. HOVER OR TAP A BRANCH FOR DETAILS.`}
      header={
        <ul className={styles.legend}>
          {legend().map((group) => (
            <li key={group.main}>
              <span className={styles.swatch} style={{ background: group.color }} />
              {group.main.toUpperCase()}
              {group.subs.map((s) => (
                <span key={s.name} className={styles.sub}>
                  <span className={styles.swatch} style={{ background: s.color }} />
                  {s.name.toUpperCase()}
                </span>
              ))}
            </li>
          ))}
        </ul>
      }
    >
      <Timeline entries={entries} fallbackToday={today} ongoingLabel="READING" label="Reading timeline" />

      <p className={styles.scrollHint}>STATS BELOW</p>
      <Charts books={books} today={today} />
    </PixelPage>
  );
}
