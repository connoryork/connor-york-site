"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./PixelTabs.module.css";

export type Tab = { href: string; label: string };

/** A row of tab links, pinned to the top of the screen; the current page's tab is lit. */
export default function PixelTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav className={styles.tabs} aria-label={label}>
      {tabs.map((tab) => {
        const current = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={current ? `${styles.tab} ${styles.current}` : styles.tab}
            aria-current={current ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
