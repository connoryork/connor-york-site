"use client";

import { useState } from "react";
import Badge from "./Badge";
import JsonCard from "./JsonCard";
import type { PixelGrid } from "./pixelate";
import styles from "./BadgeShelf.module.css";

export type BadgeData = {
  name: string;
  caption: string;
  color: string;
  logo: PixelGrid;
  /** Shown as JSON in the badge's hover card. */
  data: Record<string, unknown>;
};

/**
 * A row of achievement-style badges. Hovering, focusing or tapping one shows
 * its data as a JSON card, the same way timeline branches do.
 */
export default function BadgeShelf({ title, badges }: { title: string; badges: BadgeData[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className={styles.shelf} aria-label={title}>
      <h2 className={styles.title}>
        {title} <span className={styles.count}>{badges.length}</span>
      </h2>
      <ul className={styles.badges}>
        {badges.map((badge) => (
          <li
            key={badge.name}
            className={styles.item}
            tabIndex={0}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(badge.name)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onPointerDown={(e) =>
              e.pointerType !== "mouse" && setActive((a) => (a === badge.name ? null : badge.name))
            }
            onFocus={() => setActive(badge.name)}
            onBlur={() => setActive(null)}
          >
            <div className={styles.badge}>
              <Badge logo={badge.logo} color={badge.color} trim="var(--yellow)" />
            </div>
            <span className={styles.name}>{badge.name.toUpperCase()}</span>
            <span className={styles.caption}>{badge.caption}</span>
            {active === badge.name && (
              <JsonCard data={badge.data} color={badge.color} style={{ top: "100%", left: 0, marginTop: 8, maxWidth: "calc(100vw - 48px)" }} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
