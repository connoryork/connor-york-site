import type { MultiPoint, Position } from "geojson";
import type { MapFile } from "./format";

// [west, south, east, north] in degrees: the region a map should frame.
export type Bounds = NonNullable<MapFile["bounds"]>;

// How many points to place along each side of the box.
const POINTS_PER_SIDE = 24;

// Turn a bounding box into points spaced all around its edge.
//
// Why points instead of a polygon? A lon/lat rectangle isn't a rectangle once
// it is projected: in most projections its edges bend. Projecting a ring of
// points and fitting to *those* frames the region correctly, however it bends,
// and it avoids polygon-direction trouble (see rewind.ts).
export function boundsToPoints([west, south, east, north]: Bounds): MultiPoint {
  const coordinates: Position[] = [];
  for (let i = 0; i <= POINTS_PER_SIDE; i++) {
    const t = i / POINTS_PER_SIDE;
    const lon = west + (east - west) * t;
    const lat = south + (north - south) * t;
    coordinates.push([lon, south], [lon, north], [west, lat], [east, lat]);
  }
  return { type: "MultiPoint", coordinates };
}
