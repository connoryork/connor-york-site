// Badge sizes in art pixels, shared by the Badge component and the logo
// script (scripts/pixelate-logo.mjs), so a logo always fits its badge.
// Kept free of JSX and path aliases so Node can run it directly.

export const BADGE_SIZE = 32;
/** The width of the trim ring. */
export const RING = 2;
/** Logos are this many pixels square, filling the disc inside the ring. */
export const LOGO_SIZE = BADGE_SIZE - 2 * RING;
