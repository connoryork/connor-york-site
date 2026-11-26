"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import JsonCard from "@/lib/pixel/JsonCard";
import { daysBetween, todayIso } from "./dates";
import { LINE, NODE, PIXEL, layoutTimeline, type Branch, type TimelineEntry } from "./layout";
import Minimap from "./Minimap";
import styles from "./Timeline.module.css";

// A client component: it needs today's date in the viewer's time zone, hover
// state for the cards, and scroll tracking for the minimap.

const noSubscribe = () => () => {};

/** Today on the client; on the server (and during hydration), `fallback`. */
function useToday(fallback: string): string {
  return useSyncExternalStore(noSubscribe, todayIso, () => fallback);
}

/**
 * A git-style timeline: a white baseline with a colored branch per entry,
 * leaving when it starts and merging back when it ends. Hover (or tap) a
 * branch for a card with the entry's data, plus how many days it ran.
 */
export default function Timeline({
  entries,
  fallbackToday,
  ongoingLabel,
  label,
}: {
  entries: TimelineEntry[];
  /** Used until the browser supplies the real today (see `latestDate`). */
  fallbackToday: string;
  /** Marks entries with no end yet, e.g. "READING". */
  ongoingLabel: string;
  /** An accessible name for the section, e.g. "Reading timeline". */
  label: string;
}) {
  const today = useToday(fallbackToday);
  const layout = useMemo(() => layoutTimeline(entries, today, ongoingLabel), [entries, today, ongoingLabel]);
  const [active, setActive] = useState<number | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const graphId = useId();

  const activeBranch = layout.branches.find((b) => b.index === active);

  return (
    <section className={styles.timelineSection} aria-label={label}>
      <div className={styles.graphScroll}>
        <div
          ref={graphRef}
          id={graphId}
          className={styles.graph}
          style={{ width: layout.width, height: layout.height }}
        >
          <svg width={layout.width} height={layout.height} shapeRendering="crispEdges" className={styles.svg}>
            {layout.ticks.map((t) => (
              <g key={t.y} className={t.year ? styles.tickYear : styles.tick}>
                <rect x={layout.baseX - 6 * PIXEL} y={t.y - PIXEL / 2} width={3 * PIXEL} height={PIXEL} />
                <text x={layout.baseX - 8 * PIXEL} y={t.y + 4} textAnchor="end">
                  {t.text}
                </text>
              </g>
            ))}

            {/* The baseline, with a marker at today. */}
            <rect
              x={layout.baseX - LINE / 2}
              y={layout.baseTop}
              width={LINE}
              height={layout.baseBottom - layout.baseTop}
              className={styles.baseline}
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

          {activeBranch && (
            <JsonCard
              data={{
                ...activeBranch.entry.data,
                days: daysBetween(activeBranch.entry.start, activeBranch.entry.end, today),
              }}
              color={activeBranch.entry.color}
              style={{
                top: activeBranch.labelY + 8 * PIXEL,
                left: `max(0px, min(${layout.labelX}px, calc(100% - 22rem)))`,
              }}
            />
          )}
        </div>
      </div>

      <Minimap layout={layout} graphRef={graphRef} graphId={graphId} />
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
  const { x, yStart, yEnd, labelY, ongoing } = branch;
  const color = branch.entry.color;
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
      {!ongoing && <rect x={baseX} y={yEnd - half} width={x - baseX + half} height={LINE} />}

      {/* Commit nodes where the branch leaves and rejoins the baseline. */}
      <Node x={baseX} y={yStart} color={color} />
      {ongoing ? <Node x={x} y={yEnd} color={color} blink /> : <Node x={baseX} y={yEnd} color={color} />}

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
      {labelY !== yEnd && (
        <rect
          x={x + 2 * PIXEL}
          y={Math.min(yEnd, labelY)}
          width={PIXEL}
          height={Math.abs(labelY - yEnd)}
          opacity={0.5}
        />
      )}
      <text x={labelX} y={labelY + 4}>
        {branch.label}
      </text>

      {/* Invisible, wider targets so thin lines are easy to hover. */}
      <rect
        x={x - 3 * PIXEL}
        y={yEnd - 3 * PIXEL}
        width={6 * PIXEL}
        height={yStart - yEnd + 6 * PIXEL}
        fill="transparent"
      />
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
      stroke="var(--black)"
      strokeWidth={PIXEL}
      className={blink ? styles.blink : undefined}
    />
  );
}
