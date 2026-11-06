import { z } from "zod";
import type { FeatureCollection } from "geojson";
import { rewindFeatureCollection } from "./rewind";

// The map file format. A map file is JSON describing one map:
//
//   { "version": 1, "name": "World", "projection": "naturalEarth",
//     "layers": [ { "type": "geojson", "data": {...}, "style": {...} } ] }
//
// The zod schemas below are the single source of truth: they validate files at
// runtime AND give us the TypeScript types (via z.infer), so the two can't drift.

// The map projections a file may ask for. Implemented in projections.ts.
export const projectionNames = [
  "naturalEarth",
  "equirectangular",
  "mercator",
] as const;

// Style options with defaults: a file can omit any of these.
const styleSchema = z.object({
  stroke: z.string().default("#d4a64a"),
  strokeWidth: z.number().positive().default(0.75),
  fill: z.string().default("none"),
});

// GeoJSON is a big standard, so we only check its outer shape here and trust the
// geometry inside. (A bad coordinate just draws nothing; it can't crash us.)
const geojsonSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(z.object({ type: z.literal("Feature") }).loose()),
});

// A layer is one drawable thing. Today the only kind is "geojson"; the "type"
// field lets us add other kinds later (e.g. "grid" for pixel maps) without
// breaking existing files.
const layerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("geojson"),
    name: z.string().optional(),
    data: geojsonSchema,
    style: styleSchema.default(styleSchema.parse({})),
  }),
]);

export const mapFileSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  projection: z.enum(projectionNames).default("naturalEarth"),
  background: z.string().default("#000000"),
  layers: z.array(layerSchema).min(1),
});

export type MapFile = z.infer<typeof mapFileSchema>;
export type MapLayer = MapFile["layers"][number];

// Turn unknown JSON (an import, or a file a user uploaded) into a typed MapFile.
// Throws an error listing every problem if the file is invalid. Also fixes the
// direction of polygon rings (see rewind.ts) so files from other tools render
// correctly.
export function parseMapFile(json: unknown): MapFile {
  const result = mapFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid map file:\n${z.prettifyError(result.error)}`);
  }
  const map = result.data;

  try {
    return {
      ...map,
      layers: map.layers.map((layer) => ({
        ...layer,
        // zod only checked the outer shape of "data", so TypeScript needs us to
        // assert the type on the way in (layerGeoJson) and back out.
        data: rewindFeatureCollection(
          layerGeoJson(layer),
        ) as unknown as typeof layer.data,
      })),
    };
  } catch {
    // The outer shape was valid but a shape inside has broken coordinates.
    throw new Error(
      "Invalid map file: a layer contains a shape with invalid coordinates.",
    );
  }
}

// zod only checked the outer shape of the GeoJSON, so TypeScript can't see it is
// a full FeatureCollection. This helper is the one place we assert that.
export function layerGeoJson(layer: MapLayer): FeatureCollection {
  return layer.data as unknown as FeatureCollection;
}
