import type { PixelGrid } from "./pixelate";

// A badge is a pixel circle: a disc in the badge's color with its logo on
// top, inside a stepped ring of trim. Sizes are in art pixels.
export const BADGE_SIZE = 32;
const RING = 2;
export const LOGO_SIZE = BADGE_SIZE - 2 * RING;

/** A round pixel-art badge; `logo` is LOGO_SIZE square. */
export default function Badge({ logo, color, trim }: { logo: PixelGrid; color: string; trim: string }) {
  const center = BADGE_SIZE / 2;
  const cells: (string | null)[][] = Array.from({ length: BADGE_SIZE }, (_, y) =>
    Array.from({ length: BADGE_SIZE }, (_, x) => {
      const d = Math.hypot(x + 0.5 - center, y + 0.5 - center);
      if (d >= center) return null;
      if (d >= center - RING) return trim;
      return logo[y - RING]?.[x - RING] ?? color;
    }),
  );

  // One rect per run of same-colored pixels in a row keeps the SVG small.
  const rects: React.ReactNode[] = [];
  cells.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const fill = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === fill) end += 1;
      if (fill) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />);
      x = end;
    }
  });

  return (
    <svg viewBox={`0 0 ${BADGE_SIZE} ${BADGE_SIZE}`} shapeRendering="crispEdges" aria-hidden>
      {rects}
    </svg>
  );
}
