// Builds public/atlas/roman-mediterranean.map.json: a SCHEMATIC map of the Roman
// Mediterranean around 120 CE.
//
// Run from the project root:   npx tsx scripts/build-antiquity-map.ts
//
// Read this before trusting the map: there is no historical data in it. It is
// built from MODERN country shapes (Natural Earth, public domain), used as
// stand-ins. Where the Empire held only part of a modern country, the country is
// cut down to a rough box (for example Britain south of Hadrian's Wall). So the
// borders are approximate and meant to convey extent, not exact ancient frontiers.
// The choices below (which countries, which boxes) were made from general
// knowledge of the Empire at the death of Trajan / start of Hadrian, c. 117-120 CE.

import { writeFileSync } from "node:fs";
import { parseMapFile } from "../lib/map-maker/format";
import { serializeMap } from "../lib/map-maker/download";
import { cleanGeometry, clipGeometry, type Box } from "./geo-clean";

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";

// The region to frame: [west, south, east, north].
const BOUNDS: Box = [-13, 26, 49, 57];
// Shapes are cut to the frame plus a margin, so nothing far outside is stored.
const MARGIN = 2;
const FRAME: Box = [BOUNDS[0] - MARGIN, BOUNDS[1] - MARGIN, BOUNDS[2] + MARGIN, BOUNDS[3] + MARGIN];

// Two decimals is about 1 km, plenty at this scale.
const DECIMALS = 2;

// A country, optionally cut down to a box (the part the Empire actually held).
type Entry = { code: string; box?: Box };

const ROMAN: Entry[] = [
  // Held entirely (or nearly so)
  { code: "ITA" }, { code: "ESP" }, { code: "PRT" }, { code: "FRA" }, { code: "BEL" },
  { code: "LUX" }, { code: "CHE" }, { code: "AUT" }, { code: "SVN" }, { code: "HRV" },
  { code: "BIH" }, { code: "SRB" }, { code: "MNE" }, { code: "KOS" }, { code: "MKD" },
  { code: "ALB" }, { code: "GRC" }, { code: "BGR" }, { code: "CYP" }, { code: "MLT" },
  { code: "SYR" }, { code: "LBN" }, { code: "ISR" }, { code: "PSX" }, { code: "JOR" },
  { code: "EGY" }, { code: "TUN" },
  // Only part of the modern country
  { code: "GBR", box: [-6, 49.5, 2, 55.0] }, //  England and Wales: south of Hadrian's Wall
  { code: "NLD", box: [3, 50.5, 7.5, 52.2] }, //  south of the Rhine mouth
  { code: "HUN", box: [15.5, 45.5, 19.05, 49] }, // Pannonia: west of the Danube
  { code: "ROU", box: [20, 43.5, 26.2, 48] }, //   Dacia: Banat, Oltenia, Transylvania
  { code: "TUR", box: [25, 35, 39.5, 43] }, //     Asia Minor, up to the Euphrates
  { code: "LBY", box: [9, 29.5, 25.2, 33.5] }, //  Tripolitania and Cyrenaica: the coast
  { code: "DZA", box: [-2.5, 34, 8.7, 37.2] }, //  the northern strip
  { code: "MAR", box: [-7.5, 33.5, -1, 36] }, //   the far north (Mauretania Tingitana)
];

// The great power next door. Iran and Iraq stand in for the Parthian realm.
const PARTHIAN: Entry[] = [{ code: "IRN" }, { code: "IRQ" }];

type SourceFeature = {
  properties: { NAME: string; ADM0_A3: string };
  geometry: { type: string; coordinates: unknown };
};

// Does a shape's bounding box touch a box? (A cheap test to skip far-away countries.)
function touches(geometry: SourceFeature["geometry"], [w, s, e, n]: Box): boolean {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (value: unknown) => {
    if (Array.isArray(value) && typeof value[0] === "number") {
      const [x, y] = value as number[];
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    } else if (Array.isArray(value)) value.forEach(walk);
  };
  walk(geometry.coordinates);
  return maxX >= w && minX <= e && maxY >= s && minY <= n;
}

async function main() {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const source = (await response.json()) as { features: SourceFeature[] };

  const byCode = new Map(source.features.map((f) => [f.properties.ADM0_A3, f]));

  // Cut a country to its box (if any) and to the frame, then round it.
  function shapeFor(feature: SourceFeature, box?: Box) {
    let geometry = clipGeometry(feature.geometry, FRAME);
    if (geometry && box) geometry = clipGeometry(geometry, box);
    return geometry && cleanGeometry(geometry, DECIMALS);
  }

  // Build one layer's features from a list of entries. Stops if a code is missing.
  function featuresFor(entries: Entry[]) {
    return entries.flatMap(({ code, box }) => {
      const feature = byCode.get(code);
      if (!feature) throw new Error(`Not found in source: ${code}`);
      const geometry = shapeFor(feature, box);
      return geometry
        ? [{ type: "Feature", properties: { name: feature.properties.NAME }, geometry }]
        : [];
    });
  }

  // Every country that touches the frame, uncut, for the dim background layer.
  const background = source.features
    .filter((f) => touches(f.geometry, FRAME))
    .flatMap((f) => {
      const geometry = shapeFor(f);
      return geometry ? [{ type: "Feature", properties: { name: f.properties.NAME }, geometry }] : [];
    });

  const roman = featuresFor(ROMAN);
  const parthian = featuresFor(PARTHIAN);

  // parseMapFile checks everything and also puts polygon rings the way d3 wants.
  const map = parseMapFile({
    version: 1,
    name: "Roman Mediterranean, c. 120 CE (schematic)",
    projection: "mercator",
    background: "#07101c",
    bounds: BOUNDS,
    layers: [
      {
        type: "geojson",
        name: "Modern countries (context)",
        style: { stroke: "#3d3524", strokeWidth: 0.4, fill: "#141008" },
        data: { type: "FeatureCollection", features: background },
      },
      {
        type: "geojson",
        name: "Parthian lands (Iran and Iraq as stand-ins)",
        // Borders only slightly brighter than the fill, so the modern country
        // lines inside the realm fade and the realm reads as one shape.
        style: { stroke: "#5a3535", strokeWidth: 0.5, fill: "#3a2222" },
        data: { type: "FeatureCollection", features: parthian },
      },
      {
        type: "geojson",
        name: "Roman Empire (modern countries as stand-ins)",
        style: { stroke: "#8c6d2c", strokeWidth: 0.5, fill: "#6b5320" },
        data: { type: "FeatureCollection", features: roman },
      },
    ],
  });

  const text = serializeMap(map);
  writeFileSync("public/atlas/roman-mediterranean.map.json", text);
  console.log(
    `Wrote public/atlas/roman-mediterranean.map.json: ${background.length} context + ${parthian.length} Parthian + ${roman.length} Roman shapes, ${(text.length / 1024).toFixed(0)} KB`,
  );
}

main();
