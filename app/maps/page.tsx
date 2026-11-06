import type { FeatureCollection } from "geojson";
import MapViewer from "@/lib/map-maker/MapViewer";
import worldLand from "@/data/world-land.json";

// A folder under app/ becomes a URL, so app/maps/page.tsx is served at /maps.
// This page stays thin: the real work lives in lib/map-maker/.
export default function MapsPage() {
  return (
    <main style={{ background: "#000", minHeight: "100vh", padding: "2rem" }}>
      {/* TypeScript sees imported JSON as loose strings/numbers, so we assert
          it is GeoJSON. Later, map files will be validated when loaded. */}
      <MapViewer data={worldLand as unknown as FeatureCollection} />
    </main>
  );
}
