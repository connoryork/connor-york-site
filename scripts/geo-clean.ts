// Shared helpers for the map-building scripts in this folder.
//
// Source data usually has far more decimal places than a screen can show, and
// stray tiny rings. These helpers shrink a polygon geometry without breaking it.

type Ring = number[][];

export type PolygonalGeometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

// Round a ring's points to `decimals` places, drop repeated neighbours the
// rounding created, and make sure it still closes. Returns null if too little is
// left to be a polygon ring (a ring needs at least 4 points).
function cleanRing(ring: Ring, decimals: number): Ring | null {
  const factor = 10 ** decimals;
  const points: Ring = [];
  for (const [lon, lat] of ring) {
    const point = [Math.round(lon * factor) / factor, Math.round(lat * factor) / factor];
    const previous = points[points.length - 1];
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      points.push(point);
    }
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) points.push([...first]);
  return points.length >= 4 ? points : null;
}

// rings = [outer ring, ...holes]
function cleanPolygon(rings: Ring[], decimals: number): Ring[] | null {
  const outer = cleanRing(rings[0], decimals);
  if (!outer) return null;
  const holes = rings
    .slice(1)
    .map((ring) => cleanRing(ring, decimals))
    .filter((ring): ring is Ring => ring !== null);
  return [outer, ...holes];
}

// Clean a Polygon or MultiPolygon. Returns null if nothing is left.
export function cleanGeometry(
  geometry: { type: string; coordinates: unknown },
  decimals: number,
): PolygonalGeometry | null {
  if (geometry.type === "Polygon") {
    const polygon = cleanPolygon(geometry.coordinates as Ring[], decimals);
    return polygon && { type: "Polygon", coordinates: polygon };
  }
  if (geometry.type === "MultiPolygon") {
    const polygons = (geometry.coordinates as Ring[][])
      .map((polygon) => cleanPolygon(polygon, decimals))
      .filter((polygon): polygon is Ring[] => polygon !== null);
    return polygons.length > 0 ? { type: "MultiPolygon", coordinates: polygons } : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Clipping: keep only the part of a shape inside a lon/lat box.
// Used to cut a modern country down to the region we want from it (for example
// "only the north coast of Libya"), and to drop everything outside a map's frame.
// ---------------------------------------------------------------------------

// [west, south, east, north] in degrees
export type Box = [number, number, number, number];

type Point = number[];

// Where the line from a to b crosses the vertical line x, or the horizontal line y.
const crossX = (a: Point, b: Point, x: number): Point => [
  x,
  a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]),
];
const crossY = (a: Point, b: Point, y: number): Point => [
  a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]),
  y,
];

// Sutherland-Hodgman: clip a ring against one box edge at a time. For each edge,
// walk around the ring keeping points on the inside, and adding a new point
// wherever the ring crosses the edge. Treats lon/lat as flat, which is fine for
// boxes this small. (A shape that leaves and re-enters the box can come out joined
// by a thin sliver along the edge; harmless for a schematic map.)
function clipRing(ring: Ring, [west, south, east, north]: Box): Ring | null {
  const edges = [
    { inside: (p: Point) => p[0] >= west, cut: (a: Point, b: Point) => crossX(a, b, west) },
    { inside: (p: Point) => p[0] <= east, cut: (a: Point, b: Point) => crossX(a, b, east) },
    { inside: (p: Point) => p[1] >= south, cut: (a: Point, b: Point) => crossY(a, b, south) },
    { inside: (p: Point) => p[1] <= north, cut: (a: Point, b: Point) => crossY(a, b, north) },
  ];

  let points: Point[] = ring.slice(0, -1); // drop the repeated closing point
  for (const edge of edges) {
    const input = points;
    points = [];
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      const previous = input[(i + input.length - 1) % input.length];
      if (edge.inside(current)) {
        if (!edge.inside(previous)) points.push(edge.cut(previous, current));
        points.push(current);
      } else if (edge.inside(previous)) {
        points.push(edge.cut(previous, current));
      }
    }
    if (points.length === 0) return null;
  }
  if (points.length < 3) return null;
  return [...points, [...points[0]]];
}

function clipPolygon(rings: Ring[], box: Box): Ring[] | null {
  const outer = clipRing(rings[0], box);
  if (!outer) return null;
  const holes = rings
    .slice(1)
    .map((ring) => clipRing(ring, box))
    .filter((ring): ring is Ring => ring !== null);
  return [outer, ...holes];
}

// Clip a Polygon or MultiPolygon to a box. Returns null if nothing is left.
export function clipGeometry(
  geometry: { type: string; coordinates: unknown },
  box: Box,
): PolygonalGeometry | null {
  if (geometry.type === "Polygon") {
    const polygon = clipPolygon(geometry.coordinates as Ring[], box);
    return polygon && { type: "Polygon", coordinates: polygon };
  }
  if (geometry.type === "MultiPolygon") {
    const polygons = (geometry.coordinates as Ring[][])
      .map((polygon) => clipPolygon(polygon, box))
      .filter((polygon): polygon is Ring[] => polygon !== null);
    return polygons.length > 0 ? { type: "MultiPolygon", coordinates: polygons } : null;
  }
  return null;
}
