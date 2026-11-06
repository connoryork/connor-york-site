import type { MapFile } from "./format";

// Turn a map into the text of a map file. Plain JSON.stringify(map, null, 2)
// would put every single coordinate on its own line (thousands of lines), so we
// pretty-print the structure and keep each GeoJSON feature on one line:
// readable at the top, compact where the numbers are.
export function serializeMap(map: MapFile): string {
  const features: unknown[] = [];

  // Step 1: copy the map, swapping each feature for a short placeholder string.
  const skeleton = {
    ...map,
    layers: map.layers.map((layer) => ({
      ...layer,
      data: {
        ...layer.data,
        features: layer.data.features.map((feature) => {
          features.push(feature);
          return `@@feature-${features.length - 1}@@`;
        }),
      },
    })),
  };

  // Step 2: pretty-print the skeleton, then put each real feature back as a
  // single compact line in place of its placeholder.
  return (
    JSON.stringify(skeleton, null, 2).replace(
      /"@@feature-(\d+)@@"/g,
      (_match, index) => JSON.stringify(features[Number(index)]),
    ) + "\n"
  );
}

// "Archipelago (example)" -> "archipelago-example.map.json"
export function mapFileName(map: MapFile): string {
  const slug = map.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "map"}.map.json`;
}

// Browser only: offer the map as a file download.
export function downloadMap(map: MapFile): void {
  const blob = new Blob([serializeMap(map)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // The standard trick: click an invisible <a download> link, then clean up.
  const link = document.createElement("a");
  link.href = url;
  link.download = mapFileName(map);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
