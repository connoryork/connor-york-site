// The "camera" for a map: where it sits inside its frame. Pure functions only (no
// React, no browser), so they are easy to test and reuse.

// The drawing area is 960 x 500 "map units". The SVG scales those to fit the screen,
// so everything below works in map units, not pixels.
export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

// A point at (px, py) in the map's own coordinates is drawn at
// (k * px + x, k * py + y). So { x: 0, y: 0, k: 1 } is "the map as fitted", and
// changing x and y slides it (panning).
export type View = { x: number; y: number; k: number };

export const IDENTITY_VIEW: View = { x: 0, y: 0, k: 1 };

// Zoom limits. 1 is "the map as fitted" (you can't zoom out past the whole map);
// 40 is plenty to read a single country's coastline.
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 40;

// How far, as a fraction of the frame, the map may be dragged past an edge. Some
// slack feels natural; too much lets you lose the map completely.
const SLACK = 0.25;

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

// Keep the view in a sensible range so the map can't be dragged out of sight.
export function clampView(view: View): View {
  const slackX = MAP_WIDTH * SLACK;
  const slackY = MAP_HEIGHT * SLACK;
  return {
    k: view.k,
    // The map spans [x, x + k * width]. Keep it overlapping the frame.
    x: clamp(view.x, MAP_WIDTH - view.k * MAP_WIDTH - slackX, slackX),
    y: clamp(view.y, MAP_HEIGHT - view.k * MAP_HEIGHT - slackY, slackY),
  };
}

// Slide the map by (dx, dy) map units.
export function panBy(view: View, dx: number, dy: number): View {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy });
}

// Zoom by `factor` (2 = twice as close, 0.5 = twice as far), keeping the point
// (px, py) of the frame, in map units, exactly where it is on screen. That is what
// makes zooming "toward the cursor" feel right.
//
// Why the formula works: the map point under (px, py) is c = (p - t) / k. After
// zooming it must still land on p, so p = k' * c + t', which gives
// t' = p - (k' / k) * (p - t).
export function zoomAt(view: View, factor: number, px: number, py: number): View {
  const k = clamp(view.k * factor, MIN_ZOOM, MAX_ZOOM);
  const ratio = k / view.k; // may differ from `factor` if we hit a limit
  return clampView({
    k,
    x: px - (px - view.x) * ratio,
    y: py - (py - view.y) * ratio,
  });
}

// Computers store decimals with tiny rounding errors. Measured here: zooming in and
// then back out around the same point leaves x or y off from 0 by about 0.0000000000001
// in nearly half of all tries. So "is it at the start?" and "is it at a limit?" allow
// a hair of tolerance instead of using exact equality, or Reset view would stay
// enabled on a map that looks untouched.
const EPSILON = 1e-6;

export function isIdentity(view: View): boolean {
  return (
    Math.abs(view.x) < EPSILON &&
    Math.abs(view.y) < EPSILON &&
    Math.abs(view.k - 1) < EPSILON
  );
}

export const canZoomIn = (view: View) => view.k < MAX_ZOOM - EPSILON;
export const canZoomOut = (view: View) => view.k > MIN_ZOOM + EPSILON;
