"use client";

import { useEffect, useState } from "react";
import { PIXEL, type TimelineLayout } from "./layout";
import styles from "./Timeline.module.css";

/**
 * A thin overview of the whole timeline, pinned beside it. The box shows the
 * part on screen; click or drag anywhere on the rail to jump there.
 */
export default function Minimap({
  layout,
  graphRef,
  graphId,
}: {
  layout: TimelineLayout;
  graphRef: React.RefObject<HTMLDivElement | null>;
  graphId: string;
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

  // Only the baseline and lanes are drawn, squeezed to the rail's width.
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
        aria-controls={graphId}
        aria-valuenow={Math.round(view.top * 100)}
        aria-label="Timeline overview"
      >
        <svg viewBox={`0 0 ${viewWidth} ${layout.height}`} preserveAspectRatio="none" className={styles.minimapSvg}>
          <line
            x1={scaleX(layout.baseX)}
            x2={scaleX(layout.baseX)}
            y1={layout.baseTop}
            y2={layout.baseBottom}
            stroke="var(--white)"
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
                ...(b.ongoing ? [] : [[scaleX(layout.baseX), b.yEnd]]),
              ]
                .map((p) => p.join(","))
                .join(" ")}
              fill="none"
              stroke={b.entry.color}
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
