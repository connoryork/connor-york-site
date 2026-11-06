// Builds app/icon.svg: the site's icon, a gold globe on a dark rounded square.
//
// Run from the project root:   npx tsx scripts/build-icon.ts
//
// The globe is drawn from the project's own world map (public/atlas/world.map.json)
// using the same d3-geo library the map viewer uses, just with an orthographic
// ("seen from space") projection instead of a flat one.
//
// Next.js uses a file named app/icon.svg as the site's favicon automatically.

import { readFileSync, writeFileSync } from "node:fs";
import { geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import { parseMapFile } from "../lib/map-maker/format";

const SIZE = 512; // the drawing is 512 x 512 units; SVG scales to any size
const GOLD = "#d4a64a";
const RADIUS = 196; // radius of the globe

function main() {
  const map = parseMapFile(
    JSON.parse(readFileSync("public/atlas/world.map.json", "utf8")),
  );
  const land = map.layers[0].data;

  // Orthographic projection: the globe as seen from space. rotate([-20, -25])
  // puts longitude 20°E, latitude 25°N at the center, so Europe, Africa and the
  // Middle East face us. clipAngle(90) hides the far side of the planet.
  const projection = geoOrthographic()
    .rotate([-20, -25])
    .scale(RADIUS)
    .translate([SIZE / 2, SIZE / 2])
    .clipAngle(90);

  // digits(0) writes whole numbers only. In a 512-unit drawing that is accurate
  // to about 0.2%, invisible at icon sizes, and it keeps the file small.
  const toPath = geoPath(projection).digits(0);

  const landPath = toPath(land as never);
  const gridPath = toPath(geoGraticule().step([30, 30])());
  if (!landPath || !gridPath) throw new Error("Drawing failed");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>Map Maker</title>
  <!-- Background: a dark rounded square -->
  <rect width="${SIZE}" height="${SIZE}" rx="112" fill="#0b0b0b"/>
  <!-- The ocean: a dark disc with a gold rim -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${RADIUS}" fill="#16130b" stroke="${GOLD}" stroke-width="10"/>
  <!-- Faint grid lines every 30 degrees -->
  <path d="${gridPath}" fill="none" stroke="${GOLD}" stroke-opacity="0.25" stroke-width="2"/>
  <!-- The land, from the world map -->
  <path d="${landPath}" fill="${GOLD}"/>
</svg>
`;

  writeFileSync("app/icon.svg", svg);
  console.log(`Wrote app/icon.svg (${(svg.length / 1024).toFixed(1)} KB)`);
}

main();
