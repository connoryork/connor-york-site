import styles from "./PixelIntro.module.css";

/** The lines that introduce a page or tab, lined up with the page header. */
export default function PixelIntro({ children }: { children: React.ReactNode }) {
  return <div className={styles.intro}>{children}</div>;
}
