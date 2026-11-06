import { geoArea } from "d3-geo";
import type { Geometry, Position } from "geojson";
import type { MapFeatureCollection } from "./geojson";

// Why this file exists: the GeoJSON standard says a polygon's outer ring runs
// counter-clockwise, but d3-geo (our renderer) wants it clockwise. Given a
// counter-clockwise polygon, d3-geo draws "the whole globe except this shape",
// so a filled polygon floods the entire map. Files from other tools usually
// follow the standard, so we fix the direction when a map file is loaded.

// geoArea returns an area on the sphere in steradians; a full globe is 4π.
// A correctly wound polygon is smaller than half the globe (2π). A reversed one
// is the complement, so it is larger than 2π.
const HALF_GLOBE = 2 * Math.PI;

// Reverse the direction of every ring (the outer ring and any holes).
function reverseRings(rings: Position[][]): Position[][] {
  return rings.map((ring) => [...ring].reverse());
}

// rings = [outer ring, ...holes]. Returns them unchanged if already correct.
function rewindPolygon(rings: Position[][]): Position[][] {
  const area = geoArea({ type: "Polygon", coordinates: rings });
  return area > HALF_GLOBE ? reverseRings(rings) : rings;
}

function rewindGeometry(geometry: Geometry): Geometry {
  switch (geometry.type) {
    case "Polygon":
      return { ...geometry, coordinates: rewindPolygon(geometry.coordinates) };
    case "MultiPolygon":
      return {
        ...geometry,
        coordinates: geometry.coordinates.map(rewindPolygon),
      };
    case "GeometryCollection":
      return { ...geometry, geometries: geometry.geometries.map(rewindGeometry) };
    default:
      // Points and lines have no inside, so direction doesn't matter.
      return geometry;
  }
}

// Returns a corrected copy; the input is not modified.
export function rewindFeatureCollection(
  collection: MapFeatureCollection,
): MapFeatureCollection {
  return {
    ...collection,
    features: collection.features.map((feature) =>
      feature.geometry
        ? { ...feature, geometry: rewindGeometry(feature.geometry) }
        : feature,
    ),
  };
}
