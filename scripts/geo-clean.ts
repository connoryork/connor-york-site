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
