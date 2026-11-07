# Map file format (version 1)

A map is one JSON file. The world map at `public/atlas/world.map.json` is the reference example.
The schema lives in `lib/map-maker/format.ts`, which is the source of truth; this page
is the human-readable summary.

```json
{
  "version": 1,
  "name": "World",
  "projection": "naturalEarth",
  "background": "#000000",
  "bounds": [-40, -25, 50, 30],
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
| `projection` | no       | `"naturalEarth"` | One of `naturalEarth`, `equirectangular`, `mercator`, `albersUsa`. `albersUsa` draws only US territory (Alaska and Hawaii as insets) and can't be combined with `bounds`. |
| `background` | no       | `"#000000"`      | Any CSS color.                                     |
| `bounds`     | no       | all shapes       | `[west, south, east, north]` in degrees: the region to frame. West must be less than east (no crossing the 180° line). `mercator` can't show beyond about ±85° latitude. |
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

## Shape validation

Every shape in a layer's `data` is checked when the file loads: known geometry types
(`Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`,
`GeometryCollection`), numeric `[longitude, latitude]` positions, lines with at least 2
points, and polygon rings with at least 4 points that end where they start. A bad shape
gives an error naming its location, such as
`layers[0].data.features[3].geometry.coordinates`, and the current map stays on screen.

## Trying it

Open `/maps`. The whole window is the map, with controls in the top right:

- **Map icon**: a scrolling list of the built-in maps in `public/atlas/` (the list
  itself is `lib/map-maker/library.ts`).
- **Layers**: tick layers on and off (a view setting only; it doesn't change the file).
- **Upload icon**: open your own `.json` map file. It is read in your browser and never
  uploaded anywhere. Invalid files show an error and leave the current map in place.
- **Download icon**: save the current map back out as a file.

Drag to pan; scroll, pinch or double-click to zoom; the arrow keys, `+`, `-` and `0` work
when the map has focus.

To add a built-in map, put the file in `public/atlas/` and add an entry to `library.ts`.

## Polygon direction

The renderer (`d3-geo`) draws on a sphere and wants the outside ring of each polygon to run
clockwise, while the GeoJSON standard says counter-clockwise. You don't need to care:
`parseMapFile` reverses any polygon whose ring is the wrong way round (see
`lib/map-maker/rewind.ts`), so GeoJSON from tools like geojson.io works as-is.

Limitation: a single polygon larger than half the globe can't be told apart from a
reversed one, so it would be flipped. Split such shapes into smaller polygons.

## Design notes

- **Self-contained:** the geometry is embedded, so one file is one whole map. That makes
  uploading a map a single-file operation.
- **Extensible:** new layer types (for example a `"grid"` layer for pixel/tile maps) can be
  added without breaking existing files, because layers are selected by `type`.
- **Validated on load:** `parseMapFile()` rejects invalid files with a readable error.
