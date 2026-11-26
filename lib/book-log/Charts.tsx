import type { Book } from "./books";
import {
  categoryStats,
  daysPerYearStats,
  lengthStats,
  pagesPerYearStats,
  ratingStats,
  type Row,
} from "./stats";
import styles from "./BookLog.module.css";

// The statistics below the timeline. Every chart is the same kind: rows of
// pixel blocks, one block per book where that makes sense, colored like the
// book's branch so the charts and the timeline read together.

export default function Charts({ books, today }: { books: Book[]; today: string }) {
  const ratings = ratingStats(books);
  const categories = categoryStats(books);
  const length = lengthStats(books);
  const days = daysPerYearStats(books, today);
  const pages = pagesPerYearStats(books, today);

  return (
    <section className={styles.charts} aria-label="Reading statistics">
      <Panel
        title="RATINGS"
        stat={ratings.average === null ? "-" : `${ratings.average.toFixed(1)}/5`}
        caption={`${ratings.rated} OF ${ratings.total} BOOKS RATED`}
      >
        <BlockRows rows={ratings.rows} />
      </Panel>

      <Panel
        title="CATEGORIES"
        stat={String(books.length)}
        caption={`BOOKS. ${categories.multi} IN MORE THAN ONE CATEGORY, COUNTED IN EACH`}
      >
        <BlockRows rows={categories.rows} />
      </Panel>

      <Panel
        title="LENGTH"
        stat={length.average === null ? "-" : `${Math.round(length.average)}`}
        caption="PAGES PER BOOK ON AVERAGE"
      >
        <BarRows rows={length.rows} marker={length.average} />
      </Panel>

      <Panel
        title="DAYS TO FINISH"
        stat={days.average === null ? "-" : `${Math.round(days.average)}`}
        caption="DAYS ON AVERAGE, BY YEAR FINISHED"
      >
        <BarRows rows={days.rows} />
      </Panel>

      <Panel
        title="PAGES PER YEAR"
        stat={pages.total.toLocaleString("en-US")}
        caption="PAGES OF FINISHED BOOKS, BY YEAR FINISHED"
        wide
      >
        <BarRows rows={pages.rows} />
      </Panel>
    </section>
  );
}

function Panel({
  title,
  stat,
  caption,
  wide,
  children,
}: {
  title: string;
  stat: string;
  caption: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={`${styles.panel} ${wide ? styles.panelWide : ""}`}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <p className={styles.stat}>{stat}</p>
      <p className={styles.caption}>{caption}</p>
      {children}
    </article>
  );
}

/** One square block per segment, e.g. one per book. */
function BlockRows({ rows }: { rows: Row[] }) {
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <span className={styles.rowLabel}>{row.label}</span>
          <span className={styles.blocks}>
            {row.segments.map((s, i) => (
              <span key={i} className={styles.block} style={{ background: s.color }} title={s.title} />
            ))}
          </span>
          <span className={styles.rowNote}>{row.note}</span>
        </div>
      ))}
    </div>
  );
}

/** Bars whose length is proportional to value, split into colored segments. */
function BarRows({ rows, marker }: { rows: Row[]; marker?: number | null }) {
  const totals = rows.map((r) => r.segments.reduce((sum, s) => sum + s.value, 0));
  const max = Math.max(1, ...totals);
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <span className={styles.rowLabel} title={row.label}>
            {row.label}
          </span>
          <span className={styles.bar}>
            {row.segments.map((s, i) => (
              <span
                key={i}
                className={styles.barSegment}
                style={{ width: `${(s.value / max) * 100}%`, background: s.color }}
                title={s.title}
              />
            ))}
            {marker != null && <span className={styles.marker} style={{ left: `${(marker / max) * 100}%` }} />}
          </span>
          <span className={styles.rowNote}>{row.note}</span>
        </div>
      ))}
    </div>
  );
}
