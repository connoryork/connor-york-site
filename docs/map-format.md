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

## Design notes

- **Self-contained:** the geometry is embedded, so one file is one whole map. That makes
  uploading a map a single-file operation.
- **Extensible:** new layer types (for example a `"grid"` layer for pixel/tile maps) can be
  added without breaking existing files, because layers are selected by `type`.
- **Validated on load:** `parseMapFile()` rejects invalid files with a readable error.
