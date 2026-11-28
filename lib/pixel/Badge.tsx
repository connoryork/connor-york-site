// A badge is a pixel circle: a disc in the badge's color with its logo on
// top, inside a stepped ring of trim. Sizes are in art pixels.
const BADGE_SIZE = 32;
const RING = 2;
/** Logos are this many pixels square; see scripts/pixelate-logo.mjs. */
export const LOGO_SIZE = BADGE_SIZE - 2 * RING;

/** A round pixel-art badge. `logo` is the URL of a LOGO_SIZE-square image. */
export default function Badge({ logo, color, trim }: { logo: string; color: string; trim: string }) {
  const center = BADGE_SIZE / 2;
  // One rect per run of same-colored pixels in a row keeps the SVG small.
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < BADGE_SIZE; y++) {
    const fillAt = (x: number) => {
      const d = Math.hypot(x + 0.5 - center, y + 0.5 - center);
      return d >= center ? null : d >= center - RING ? trim : color;
    };
    for (let x = 0; x < BADGE_SIZE; ) {
      const fill = fillAt(x);
      let end = x + 1;
      while (end < BADGE_SIZE && fillAt(end) === fill) end += 1;
      if (fill) rects.push(<rect key={`${x},${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />);
      x = end;
    }
  }

  return (
    <svg viewBox={`0 0 ${BADGE_SIZE} ${BADGE_SIZE}`} shapeRendering="crispEdges" aria-hidden>
      {rects}
      <image href={logo} x={RING} y={RING} width={LOGO_SIZE} height={LOGO_SIZE} />
    </svg>
  );
}
