import MapViewer from "@/lib/map-maker/MapViewer";
import { parseMapFile } from "@/lib/map-maker/format";
import worldMapFile from "@/data/world.map.json";

// A folder under app/ becomes a URL, so app/maps/page.tsx is served at /maps.
// This page stays thin: the real work lives in lib/map-maker/.
export default function MapsPage() {
  // parseMapFile checks the JSON against the map file format and fills in
  // defaults. It throws a readable error if the file is invalid.
  const map = parseMapFile(worldMapFile);

  return (
    <main
      style={{ background: map.background, minHeight: "100vh", padding: "2rem" }}
    >
      <MapViewer map={map} />
    </main>
  );
}
