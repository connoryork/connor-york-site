import { Press_Start_2P } from "next/font/google";
import Link from "next/link";
import styles from "./PixelPage.module.css";

const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });

/**
 * The shell for an 8-bit page: the pixel font and palette, a link home, a
 * title, and optionally a nav (such as PixelTabs) pinned below it.
 */
export default function PixelPage({
  title,
  nav,
  children,
}: {
  title: string;
  nav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.page} ${nav ? styles.withNav : ""} ${pixelFont.className}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          &lt; HOME
        </Link>
        <h1 className={styles.title}>{title}</h1>
      </header>
      {nav}
      {children}
    </div>
  );
}
