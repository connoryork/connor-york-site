"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Book } from "./books";
import { LINE, NODE, PIXEL, layoutTimeline, type Branch } from "./layout";
import { daysReading, todayIso } from "./stats";
import styles from "./BookLog.module.css";

// A client component: it needs today's date in the viewer's time zone, hover
// state for the book cards, and scroll tracking for the minimap.

const noSubscribe = () => () => {};

/** Today on the client; on the server (and during hydration), `fallback`. */
function useToday(fallback: string): string {
  return useSyncExternalStore(noSubscribe, todayIso, () => fallback);
}

export default function Timeline({ books, fallbackToday }: { books: Book[]; fallbackToday: string }) {
  const today = useToday(fallbackToday);
  const layout = useMemo(() => layoutTimeline(books, today), [books, today]);
  const [active, setActive] = useState<number | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const activeBranch = layout.branches.find((b) => b.index === active);

  return (
    <section className={styles.timelineSection} aria-label="Reading timeline">
      <div className={styles.graphScroll}>
        <div ref={graphRef} id="timeline" className={styles.graph} style={{ width: layout.width, height: layout.height }}>
          <svg
            width={layout.width}
            height={layout.height}
            shapeRendering="crispEdges"
            className={styles.svg}
          >
            {layout.ticks.map((t) => (
              <g key={t.y} className={t.year ? styles.tickYear : styles.tick}>
                <rect x={layout.baseX - 6 * PIXEL} y={t.y - PIXEL / 2} width={3 * PIXEL} height={PIXEL} />
                <text x={layout.baseX - 8 * PIXEL} y={t.y + 4} textAnchor="end">
                  {t.text}
                </text>
              </g>
            ))}

            {/* The baseline, with a HEAD marker at today. */}
            <rect
              x={layout.baseX - LINE / 2}
              y={layout.baseTop}
              width={LINE}
              height={layout.baseBottom - layout.baseTop}
              fill="#fff1e8"
            />
            <text x={layout.baseX - 8 * PIXEL} y={layout.baseTop + 4} textAnchor="end" className={styles.head}>
              NOW
            </text>

            {layout.branches.map((branch) => (
              <BranchShape
                key={branch.index}
                branch={branch}
                baseX={layout.baseX}
                labelX={layout.labelX}
                dimmed={active !== null && active !== branch.index}
                onEnter={() => setActive(branch.index)}
                onLeave={() => setActive((a) => (a === branch.index ? null : a))}
                onToggle={() => setActive((a) => (a === branch.index ? null : branch.index))}
              />
            ))}
          </svg>

          {activeBranch && <BookCard branch={activeBranch} labelX={layout.labelX} today={today} />}
        </div>
      </div>

      <Minimap layout={layout} graphRef={graphRef} />
    </section>
  );
}

function BranchShape({
  branch,
  baseX,
  labelX,
  dimmed,
  onEnter,
  onLeave,
  onToggle,
}: {
  branch: Branch;
  baseX: number;
  labelX: number;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
}) {
  const { x, yStart, yEnd, color, labelY, reading } = branch;
  const half = LINE / 2;
  return (
    <g
      className={dimmed ? styles.dimmed : undefined}
      fill={color}
      // A mouse shows the card on hover; touch toggles it with a tap.
      onPointerEnter={(e) => e.pointerType === "mouse" && onEnter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      onPointerDown={(e) => e.pointerType !== "mouse" && onToggle()}
      style={{ cursor: "pointer" }}
    >
      {/* Branch out, run up the lane, merge back in. */}
      <rect x={baseX} y={yStart - half} width={x - baseX + half} height={LINE} />
      <rect x={x - half} y={yEnd - half} width={LINE} height={yStart - yEnd + LINE} />
      {!reading && <rect x={baseX} y={yEnd - half} width={x - baseX + half} height={LINE} />}

      {/* Commit nodes where the branch leaves and rejoins the baseline. */}
      <Node x={baseX} y={yStart} color={color} />
      {reading ? <Node x={x} y={yEnd} color={color} blink /> : <Node x={baseX} y={yEnd} color={color} />}

      {/* A dotted leader from the top of the branch to its label. */}
      {labelX - x > 4 * PIXEL &&
        Array.from({ length: Math.floor((labelX - x - 4 * PIXEL) / (2 * PIXEL)) }, (_, i) => (
          <rect
            key={i}
            x={x + 2 * PIXEL + i * 2 * PIXEL}
            y={labelY - PIXEL / 2}
            width={PIXEL}
            height={PIXEL}
            opacity={0.5}
          />
        ))}
      {labelY !== yEnd && <rect x={x + 2 * PIXEL} y={Math.min(yEnd, labelY)} width={PIXEL} height={Math.abs(labelY - yEnd)} opacity={0.5} />}
      <text x={labelX} y={labelY + 4}>
        {branch.label}
      </text>

      {/* An invisible, wider target so thin lines are easy to hover. */}
      <rect x={x - 3 * PIXEL} y={yEnd - 3 * PIXEL} width={6 * PIXEL} height={yStart - yEnd + 6 * PIXEL} fill="transparent" />
      <rect x={labelX} y={labelY - 6 * PIXEL} width={branch.label.length * 8} height={12 * PIXEL} fill="transparent" />
    </g>
  );
}

function Node({ x, y, color, blink }: { x: number; y: number; color: string; blink?: boolean }) {
  return (
    <rect
      x={x - NODE / 2}
      y={y - NODE / 2}
      width={NODE}
      height={NODE}
      fill={color}
      stroke="#000"
      strokeWidth={PIXEL}
      className={blink ? styles.blink : undefined}
    />
  );
}

function BookCard({ branch, labelX, today }: { branch: Branch; labelX: number; today: string }) {
  const { book } = branch;
  const data = {
    title: book.title,
    author: book.author,
    categories: book.categories,
    rating: book.rating,
    began: book.began,
    completed: book.completed,
    pages: book.pages,
    days: daysReading(book, today),
  };
  return (
    <div
      className={styles.card}
      style={{
        top: branch.labelY + 8 * PIXEL,
        left: `max(0px, min(${labelX}px, calc(100% - 22rem)))`,
        borderColor: branch.color,
      }}
      role="tooltip"
    >
      <pre className={styles.json}>{highlightJson(data)}</pre>
    </div>
  );
}

// Pretty-printed JSON, with keys, strings, numbers and nulls colored.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?/g;

function highlightJson(value: unknown) {
  const text = JSON.stringify(value, null, 2);
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    parts.push(text.slice(last, m.index));
    const kind = m[1] ? (m[2] ? styles.jsonKey : styles.jsonString) : m[3] ? styles.jsonNull : styles.jsonNumber;
    parts.push(
      <span key={m.index} className={kind}>
        {m[1] ?? m[0]}
      </span>,
    );
    if (m[2]) parts.push(m[2]);
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

// A thin overview of the whole timeline, pinned beside it. The box shows the
// part on screen; click or drag anywhere on the rail to jump there.
function Minimap({
  layout,
  graphRef,
}: {
  layout: ReturnType<typeof layoutTimeline>;
  graphRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [view, setView] = useState({ top: 0, bottom: 0 });

  useEffect(() => {
    const update = () => {
      const el = graphRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = Math.max(0, -rect.top);
      const bottom = Math.min(layout.height, window.innerHeight - rect.top);
      setView({ top: top / layout.height, bottom: Math.max(top, bottom) / layout.height });
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [graphRef, layout.height]);

  const jump = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = graphRef.current;
    if (!el) return;
    const rail = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientY - rail.top) / rail.height));
    const graphTop = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: graphTop + fraction * layout.height - window.innerHeight / 2 });
  };

  const scaleX = (x: number) => x - layout.baseX + 4 * PIXEL;
  const viewWidth = scaleX(layout.laneRight) + 4 * PIXEL;

  return (
    <div className={styles.minimapColumn}>
      <div
        className={styles.minimap}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          jump(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) jump(e);
        }}
        role="scrollbar"
        aria-controls="timeline"
        aria-valuenow={Math.round(view.top * 100)}
        aria-label="Timeline overview"
      >
        <svg viewBox={`0 0 ${viewWidth} ${layout.height}`} preserveAspectRatio="none" className={styles.minimapSvg}>
          <line
            x1={scaleX(layout.baseX)}
            x2={scaleX(layout.baseX)}
            y1={layout.baseTop}
            y2={layout.baseBottom}
            stroke="#fff1e8"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          {layout.branches.map((b) => (
            <polyline
              key={b.index}
              points={[
                [scaleX(layout.baseX), b.yStart],
                [scaleX(b.x), b.yStart],
                [scaleX(b.x), b.yEnd],
                ...(b.reading ? [] : [[scaleX(layout.baseX), b.yEnd]]),
              ]
                .map((p) => p.join(","))
                .join(" ")}
              fill="none"
              stroke={b.color}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {layout.ticks
          .filter((t) => t.year)
          .map((t) => (
            <span key={t.y} className={styles.minimapYear} style={{ top: `${(t.y / layout.height) * 100}%` }}>
              {t.text.slice(2)}
            </span>
          ))}
        <div
          className={styles.minimapView}
          style={{ top: `${view.top * 100}%`, height: `${(view.bottom - view.top) * 100}%` }}
        />
      </div>
    </div>
  );
}
