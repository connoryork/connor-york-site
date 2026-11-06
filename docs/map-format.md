# Map file format (version 1)

A map is one JSON file. The world map at `data/world.map.json` is the reference example.
The schema lives in `lib/map-maker/format.ts`, which is the source of truth; this page
is the human-readable summary.

```json
{
  "version": 1,
  "name": "World",
  "projection": "naturalEarth",
  "background": "#000000",
  "layers": [
    {
      "type": "geojson",
      "name": "Land",
      "style": { "stroke": "#d4a64a", "strokeWidth": 0.75, "fill": "none" },
      "data": { "type": "FeatureCollection", "features": [] }
    }
  ]
}
```

## Top-level fields

| Field        | Required | Default          | Notes                                              |
| ------------ | -------- | ---------------- | -------------------------------------------------- |
| `version`    | yes      |                  | Must be `1`. Lets us change the format later.      |
| `name`       | yes      |                  | Shown as the map's accessible label.               |
| `projection` | no       | `"naturalEarth"` | One of `naturalEarth`, `equirectangular`, `mercator`. |
| `background` | no       | `"#000000"`      | Any CSS color.                                     |
| `layers`     | yes      |                  | At least one. Drawn in order, later on top.        |

## Layers

Every layer has a `type`. Only `"geojson"` exists today.

### `geojson` layer

| Field   | Required | Default                                       | Notes                                   |
| ------- | -------- | --------------------------------------------- | --------------------------------------- |
| `type`  | yes      |                                               | `"geojson"`                             |
| `name`  | no       |                                               | A label for humans.                     |
| `data`  | yes      |                                               | A GeoJSON `FeatureCollection` (lon/lat). |
| `style` | no       | stroke `#d4a64a`, strokeWidth `0.75`, fill `none` | Any subset of these may be given.    |

## Trying it

Open `/maps`, click "Open a map file", and pick
[`examples/archipelago.map.json`](examples/archipelago.map.json). The file is read in your
browser and never uploaded anywhere. Invalid files show an error and leave the current map
in place.

## Known gotcha: polygon direction

The renderer (`d3-geo`) draws on a sphere, so it needs the **outside ring of each polygon to
run clockwise** (as drawn with north up). The GeoJSON standard says counter-clockwise, so
GeoJSON from other tools may need its rings reversed. A wrong-direction polygon is treated
as "everything except this shape", so with a `fill` it floods the whole map. Outlines
(`"fill": "none"`) look fine either way. A future change may fix rings automatically on load.

## Design notes

- **Self-contained:** the geometry is embedded, so one file is one whole map. That makes
  uploading a map a single-file operation.
- **Extensible:** new layer types (for example a `"grid"` layer for pixel/tile maps) can be
  added without breaking existing files, because layers are selected by `type`.
- **Validated on load:** `parseMapFile()` rejects invalid files with a readable error.
