import { cacheLife } from "next/cache";
import sharp from "sharp";

/** Rows of "#rrggbb" colors, with null where the image is transparent. */
export type PixelGrid = (string | null)[][];

/**
 * Shrinks an image to `size` x `size` pixels in its `colors` most common
 * colors, so it reads as pixel art: each pixel snaps to the nearest of them
 * instead of keeping the blended edges a plain shrink leaves.
 * Runs at build time; the result is cached into the static page, and an
 * image file only changes with a new build.
 */
export async function pixelate(file: string, size: number, colors: number): Promise<PixelGrid> {
  "use cache";
  cacheLife("max");
  const full = await sharp(file).ensureAlpha().raw().toBuffer();
  const palette = commonColors(full, colors);

  const small = await sharp(file)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer();
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      const i = (y * size + x) * 4;
      if (small[i + 3] < 128) return null;
      return hex(nearest(palette, [small[i], small[i + 1], small[i + 2]]));
    }),
  );
}

type Rgb = [number, number, number];

/** The `count` most common opaque colors, grouping near-identical shades. */
function commonColors(rgba: Buffer, count: number): Rgb[] {
  const groups = new Map<number, { n: number; sum: Rgb }>();
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const key = ((rgba[i] >> 4) << 8) | ((rgba[i + 1] >> 4) << 4) | (rgba[i + 2] >> 4);
    const group = groups.get(key) ?? { n: 0, sum: [0, 0, 0] };
    group.n += 1;
    group.sum[0] += rgba[i];
    group.sum[1] += rgba[i + 1];
    group.sum[2] += rgba[i + 2];
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((g) => g.sum.map((c) => Math.round(c / g.n)) as Rgb);
}

function nearest(palette: Rgb[], c: Rgb): Rgb {
  const distance = (p: Rgb) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
  return palette.reduce((best, p) => (distance(p) < distance(best) ? p : best));
}

function hex(c: Rgb): string {
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}
