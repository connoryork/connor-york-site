import { Press_Start_2P } from "next/font/google";
import Link from "next/link";
import { books } from "./books";
import Charts from "./Charts";
import Timeline from "./Timeline";
import { latestDate, legend } from "./stats";
import styles from "./BookLog.module.css";

const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });

export default function BookLog() {
  // The page is prerendered, so it can't know today; the latest date in the
  // log stands in. The timeline swaps in the viewer's own today once it
  // loads, so the in-progress branch keeps growing.
  const today = latestDate(books);
  const years = books.map((b) => Number(b.began.slice(0, 4)));

  return (
    <div className={`${styles.page} ${pixelFont.className}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          &lt; HOME
        </Link>
        <h1 className={styles.title}>BOOK LOG</h1>
        <p className={styles.subtitle}>
          {books.length} BOOKS, {Math.min(...years)}-{today.slice(0, 4)}. HOVER OR TAP A BRANCH FOR DETAILS.
        </p>
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
      </header>

      <Timeline books={books} fallbackToday={today} />

      <p className={styles.scrollHint}>STATS BELOW</p>
      <Charts books={books} today={today} />
    </div>
  );
}
