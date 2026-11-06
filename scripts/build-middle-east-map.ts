// Builds public/atlas/middle-east.map.json from Natural Earth's country borders.
//
// Run from the project root:   npx tsx scripts/build-middle-east-map.ts
//
// A one-off data-preparation script (see build-usa-map.ts). Data: Natural Earth
// (https://www.naturalearthdata.com), public domain. Natural Earth draws borders
// as they exist in practice ("de facto"); disputed areas are shown that way and
// this map takes no position on them.

import { writeFileSync } from "node:fs";
import { parseMapFile } from "../lib/map-maker/format";
import { serializeMap } from "../lib/map-maker/download";
import { cleanGeometry } from "./geo-clean";

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";

// Countries are picked by their 3-letter "ADM0_A3" code in the source data.
const MIDDLE_EAST = [
  "TUR", "SYR", "LBN", "ISR", "PSX", "JOR", "IRQ", "IRN", "KWT", "SAU",
  "BHR", "QAT", "ARE", "OMN", "YEM", "EGY", "CYP", "CYN",
];
// Drawn dimmer, for context around the edges of the frame.
const NEIGHBOURS = [
  "GRC", "BGR", "GEO", "ARM", "AZE", "TKM", "UZB", "AFG", "PAK",
  "LBY", "SDN", "ERI", "DJI", "SOM", "SOL", "ETH",
];

// The region to frame: [west, south, east, north].
const BOUNDS = [24, 10, 66, 43];

// Two decimals is about 1 km, plenty for a map spanning 40 degrees of longitude.
const DECIMALS = 2;

type SourceFeature = {
  properties: { NAME: string; ADM0_A3: string };
  geometry: { type: string; coordinates: unknown };
};

async function main() {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const source = (await response.json()) as { features: SourceFeature[] };

  // Build one layer's features from a list of country codes.
  function featuresFor(codes: string[]) {
    const found = source.features.filter((f) => codes.includes(f.properties.ADM0_A3));
    const missing = codes.filter((c) => !found.some((f) => f.properties.ADM0_A3 === c));
    if (missing.length > 0) throw new Error(`Not found in source: ${missing.join(", ")}`);

    return found.flatMap((f) => {
      const geometry = cleanGeometry(f.geometry, DECIMALS);
      // Keep only the country's name; the source has about 160 other fields.
      return geometry
        ? [{ type: "Feature", properties: { name: f.properties.NAME }, geometry }]
        : [];
    });
  }

  const middleEast = featuresFor(MIDDLE_EAST);
  const neighbours = featuresFor(NEIGHBOURS);

  // parseMapFile checks everything and also puts polygon rings the way d3 wants.
  const map = parseMapFile({
    version: 1,
    name: "Middle East",
    projection: "mercator",
    background: "#000000",
    bounds: BOUNDS,
    layers: [
      {
        type: "geojson",
        name: "Neighbouring countries",
        style: { stroke: "#6b5a2e", strokeWidth: 0.5, fill: "#0d0b07" },
        data: { type: "FeatureCollection", features: neighbours },
      },
      {
        type: "geojson",
        name: "Middle East",
        style: { stroke: "#d4a64a", strokeWidth: 0.8, fill: "#33291a" },
        data: { type: "FeatureCollection", features: middleEast },
      },
    ],
  });

  const text = serializeMap(map);
  writeFileSync("public/atlas/middle-east.map.json", text);
  console.log(
    `Wrote public/atlas/middle-east.map.json: ${middleEast.length} + ${neighbours.length} countries, ${(text.length / 1024).toFixed(0)} KB`,
  );
}

main();
