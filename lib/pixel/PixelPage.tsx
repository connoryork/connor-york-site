import { Press_Start_2P } from "next/font/google";
import Link from "next/link";
import styles from "./PixelPage.module.css";

const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });

/**
 * The shell for an 8-bit page: the pixel font and palette, a link home, and
 * a header with the title, a subtitle, and anything else in `header`.
 */
export default function PixelPage({
  title,
  subtitle,
  header,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.page} ${pixelFont.className}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          &lt; HOME
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        {header}
      </header>
      {children}
    </div>
  );
}
