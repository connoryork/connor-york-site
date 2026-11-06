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

export function isIdentity(view: View): boolean {
  return view.x === 0 && view.y === 0 && view.k === 1;
}
