import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";

type MapViewerProps = {
  // GeoJSON: a standard JSON format for shapes described in longitude/latitude.
  data: FeatureCollection;
  width?: number;
  height?: number;
};

// Draws GeoJSON as an SVG map. It has no state or interactivity yet, so it is a
// plain server component: Next.js renders it to HTML on the server.
export default function MapViewer({
  data,
  width = 960,
  height = 500,
}: MapViewerProps) {
  // A projection turns [longitude, latitude] into flat [x, y] pixel positions.
  // fitSize scales and centers it so the data fills the width x height box.
  const projection = geoNaturalEarth1().fitSize([width, height], data);

  // geoPath turns a GeoJSON shape into an SVG path string (the "d" attribute).
  const toPath = geoPath(projection);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="World map"
      style={{ width: "100%", height: "auto" }}
    >
      {data.features.map((feature, i) => (
        <path
          key={i}
          d={toPath(feature) ?? undefined}
          fill="none"
          stroke="#d4a64a"
          strokeWidth={0.75}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
