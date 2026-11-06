// Builds public/atlas/usa.map.json from Natural Earth's state boundaries.
//
// Run from the project root:   npx tsx scripts/build-usa-map.ts
//
// This is a one-off data-preparation script, not part of the website. It is kept
// in the repo so the map file can be rebuilt (or rebuilt at a different detail
// level) instead of being an unexplained blob.
//
// Data: Natural Earth (https://www.naturalearthdata.com), public domain.

import { writeFileSync } from "node:fs";
import { parseMapFile } from "../lib/map-maker/format";
import { serializeMap } from "../lib/map-maker/download";
import { cleanGeometry } from "./geo-clean";

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";

// Three decimal places is about 100 m: far finer than a national map needs, and
// it makes the file much smaller than the source's long decimals.
const DECIMALS = 3;

async function main() {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const source = (await response.json()) as {
    features: {
      properties: { name: string; adm0_a3: string };
      geometry: { type: string; coordinates: unknown };
    }[];
  };

  const features = source.features
    .filter((f) => f.properties.adm0_a3 === "USA")
    .flatMap((f) => {
      const geometry = cleanGeometry(f.geometry, DECIMALS);
      // Keep only the state's name; the source has about 80 other fields.
      return geometry
        ? [{ type: "Feature", properties: { name: f.properties.name }, geometry }]
        : [];
    });

  // parseMapFile checks everything and also puts polygon rings the way d3 wants.
  const map = parseMapFile({
    version: 1,
    name: "United States",
    projection: "albersUsa",
    background: "#000000",
    layers: [
      {
        type: "geojson",
        name: "States",
        style: { stroke: "#d4a64a", strokeWidth: 0.6, fill: "#16130b" },
        data: { type: "FeatureCollection", features },
      },
    ],
  });

  const text = serializeMap(map);
  writeFileSync("public/atlas/usa.map.json", text);
  console.log(
    `Wrote public/atlas/usa.map.json: ${features.length} states, ${(text.length / 1024).toFixed(0)} KB`,
  );
}

main();
