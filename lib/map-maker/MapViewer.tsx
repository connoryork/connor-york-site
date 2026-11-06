import { geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { layerGeoJson, type MapFile } from "./format";
import { createProjection } from "./projections";

type MapViewerProps = {
  // An already-validated map file (see parseMapFile in format.ts).
  map: MapFile;
  width?: number;
  height?: number;
};

// Draws a map file as SVG. It has no state or interactivity yet, so it is a
// plain server component: Next.js renders it to HTML on the server.
export default function MapViewer({
  map,
  width = 960,
  height = 500,
}: MapViewerProps) {
  // Fit the projection to ALL layers together so the whole map fills the box.
  const everything: FeatureCollection = {
    type: "FeatureCollection",
    features: map.layers.flatMap((layer) => layerGeoJson(layer).features),
  };
  const projection = createProjection(map.projection).fitSize(
    [width, height],
    everything,
  );

  // geoPath turns a GeoJSON shape into an SVG path string (the "d" attribute).
  const toPath = geoPath(projection);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={map.name}
      style={{ width: "100%", height: "auto", background: map.background }}
    >
      {map.layers.map((layer, layerIndex) => (
        // One <g> (group) per layer, drawn in file order: later layers on top.
        <g
          key={layerIndex}
          fill={layer.style.fill}
          stroke={layer.style.stroke}
          strokeWidth={layer.style.strokeWidth}
          strokeLinejoin="round"
        >
          {layerGeoJson(layer).features.map((feature, i) => (
            <path key={i} d={toPath(feature) ?? undefined} />
          ))}
        </g>
      ))}
    </svg>
  );
}
