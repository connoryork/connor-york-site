import styles from "./JsonCard.module.css";

/**
 * A pixel-bordered pop-up showing `data` as pretty-printed, syntax-colored
 * JSON. The caller places it with `style` (it's absolutely positioned) and
 * picks the border color; on phones it pins to the bottom of the screen.
 */
export default function JsonCard({
  data,
  color,
  style,
}: {
  data: unknown;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={styles.card} style={{ ...style, borderColor: color }} role="tooltip">
      <pre className={styles.json}>{highlightJson(data)}</pre>
    </div>
  );
}

// Strings (and whether each is a key), literals, and numbers.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?/g;

function highlightJson(value: unknown): React.ReactNode[] {
  const text = JSON.stringify(value, null, 2);
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    parts.push(text.slice(last, m.index));
    const kind = m[1]
      ? m[2]
        ? styles.jsonKey
        : styles.jsonString
      : m[3]
        ? styles.jsonNull
        : styles.jsonNumber;
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
