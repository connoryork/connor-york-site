import { z } from "zod";
import { featureCollectionSchema } from "./geojson";
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
  "albersUsa",
] as const;

// Style options with defaults: a file can omit any of these.
const styleSchema = z.object({
  stroke: z.string().default("#d4a64a"),
  strokeWidth: z.number().positive().default(0.75),
  fill: z.string().default("none"),
});

// A layer is one drawable thing. Today the only kind is "geojson"; the "type"
// field lets us add other kinds later (e.g. "grid" for pixel maps) without
// breaking existing files.
const layerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("geojson"),
    name: z.string().optional(),
    data: featureCollectionSchema,
    style: styleSchema.default(styleSchema.parse({})),
  }),
]);

// Where to point the camera: [west, south, east, north] in degrees. Optional;
// without it the map frames all of its shapes. The box can't cross the
// antimeridian (the 180° line), so west must be less than east.
const boundsSchema = z
  .tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ])
  .refine(([west, south, east, north]) => west < east && south < north, {
    message: "bounds must be [west, south, east, north], with west < east and south < north",
  });

export const mapFileSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  projection: z.enum(projectionNames).default("naturalEarth"),
  background: z.string().default("#000000"),
  bounds: boundsSchema.optional(),
  layers: z.array(layerSchema).min(1),
});

export type MapFile = z.infer<typeof mapFileSchema>;
export type MapLayer = MapFile["layers"][number];

// How many problems to list in an error message. A bad file can have thousands
// (one per broken coordinate), and nobody wants to read them all.
const MAX_ISSUES_SHOWN = 8;

// Turn zod's issue list into short, readable lines, e.g.
//   ✖ Invalid input: expected number, received string
//     → at layers[0].data.features[3].geometry.coordinates[0][1]
function describeIssues(error: z.ZodError): string {
  const shown = error.issues.slice(0, MAX_ISSUES_SHOWN).map((issue) => {
    const where = issue.path
      .map((part) => (typeof part === "number" ? `[${part}]` : `.${String(part)}`))
      .join("")
      .replace(/^\./, "");
    return `✖ ${issue.message}\n  → at ${where || "(top level)"}`;
  });
  const hidden = error.issues.length - shown.length;
  if (hidden > 0) shown.push(`…and ${hidden} more problem(s).`);
  return shown.join("\n");
}

// Turn unknown JSON (an import, or a file a user uploaded) into a typed MapFile.
// Throws an error listing the problems if the file is invalid. Also fixes the
// direction of polygon rings (see rewind.ts) so files from other tools render
// correctly.
export function parseMapFile(json: unknown): MapFile {
  const result = mapFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid map file:\n${describeIssues(result.error)}`);
  }
  const map = result.data;

  // The shapes are fully validated by now, so rewinding can't fail.
  return {
    ...map,
    layers: map.layers.map((layer) => ({
      ...layer,
      data: rewindFeatureCollection(layer.data),
    })),
  };
}
