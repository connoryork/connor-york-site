import { Press_Start_2P } from "next/font/google";
import Link from "next/link";
import styles from "./PixelPage.module.css";

const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });

/** The shell for an 8-bit page: the pixel font and palette, a link home, and a title. */
export default function PixelPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${styles.page} ${pixelFont.className}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          &lt; HOME
        </Link>
        <h1 className={styles.title}>{title}</h1>
      </header>
      {children}
    </div>
  );
}
