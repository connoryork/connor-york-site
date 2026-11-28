// Turns a logo image into the pixel art its badge shows, saved as
// public/logos/<name>.png. Run it once when adding a logo:
//
//   npm run pixelate-logo -- <image> <name> [colors]
//
// The image is shrunk to SIZE x SIZE and cut to the badge's round disc. Each
// pixel snaps to the nearest of the image's `colors` (default 2) most common
// colors, so edges stay crisp instead of blending. Touch up the result by
// hand in any pixel editor if needed.
import sharp from "sharp";
import { LOGO_SIZE as SIZE } from "../lib/pixel/badgeSize.ts";

const [input, name, colors = "2"] = process.argv.slice(2);
if (!input || !name) {
  console.error("usage: npm run pixelate-logo -- <image> <name> [colors]");
  process.exit(1);
}

const palette = commonColors(await sharp(input).ensureAlpha().raw().toBuffer(), Number(colors));
const small = await sharp(input)
  .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .ensureAlpha()
  .raw()
  .toBuffer();

const out = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const inDisc = Math.hypot(x + 0.5 - SIZE / 2, y + 0.5 - SIZE / 2) < SIZE / 2;
    if (!inDisc || small[i + 3] < 128) continue;
    const [r, g, b] = nearest(palette, [small[i], small[i + 1], small[i + 2]]);
    out.set([r, g, b, 255], i);
  }
}

const file = `public/logos/${name}.png`;
await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(file);
console.log(`wrote ${file}`);

/** The `count` most common opaque colors, grouping near-identical shades. */
function commonColors(rgba, count) {
  const groups = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const key = ((rgba[i] >> 4) << 8) | ((rgba[i + 1] >> 4) << 4) | (rgba[i + 2] >> 4);
    const group = groups.get(key) ?? { n: 0, sum: [0, 0, 0] };
    group.n += 1;
    for (let c = 0; c < 3; c++) group.sum[c] += rgba[i + c];
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((g) => g.sum.map((c) => Math.round(c / g.n)));
}

function nearest(palette, c) {
  const distance = (p) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
  return palette.reduce((best, p) => (distance(p) < distance(best) ? p : best));
}
