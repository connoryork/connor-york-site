import { z } from "zod";
import type { FeatureCollection, Geometry } from "geojson";

// A zod description of GeoJSON (https://geojson.org), so that a map file with
// broken shapes is rejected with a clear message when it is loaded, instead of
// crashing the page when it is drawn.

// A position is [longitude, latitude], optionally followed by an altitude.
// z.number() also rejects NaN and Infinity.
const position = z.tuple([z.number(), z.number()]).rest(z.number());

// A line needs at least two points. A polygon ring is a closed loop: at least
// four positions, with the last one repeating the first.
const line = z.array(position).min(2);
const ring = z
  .array(position)
  .min(4)
  .refine(
    (points) => {
      const first = points[0];
      const last = points[points.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    },
    { message: "A polygon ring must end where it starts" },
  );
const polygon = z.array(ring).min(1);

// Annotating the type is required because this schema refers to itself
// (a GeometryCollection holds more geometries).
export const geometrySchema: z.ZodType<Geometry> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("Point"), coordinates: position }),
    z.object({ type: z.literal("MultiPoint"), coordinates: z.array(position) }),
    z.object({ type: z.literal("LineString"), coordinates: line }),
    z.object({
      type: z.literal("MultiLineString"),
      coordinates: z.array(line),
    }),
    z.object({ type: z.literal("Polygon"), coordinates: polygon }),
    z.object({
      type: z.literal("MultiPolygon"),
      coordinates: z.array(polygon),
    }),
    z.object({
      type: z.literal("GeometryCollection"),
      geometries: z.array(geometrySchema),
    }),
  ]),
);

const featureSchema = z.object({
  type: z.literal("Feature"),
  // The standard allows a feature with no shape (null).
  geometry: geometrySchema.nullable(),
  properties: z.record(z.string(), z.unknown()).nullable().default(null),
});

export const featureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(featureSchema),
});

// The standard allows a feature with no shape (null), but the TypeScript GeoJSON
// types default to requiring one, so we name the more accurate type here.
export type MapFeatureCollection = FeatureCollection<Geometry | null>;
