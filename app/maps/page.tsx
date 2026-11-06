import MapWorkspace from "@/lib/map-maker/MapWorkspace";
import { parseMapFile } from "@/lib/map-maker/format";
import worldMapFile from "@/data/world.map.json";

// A folder under app/ becomes a URL, so app/maps/page.tsx is served at /maps.
// This page stays thin: it runs on the server, validates the default map, and
// hands it to the client component that handles interaction.
export default function MapsPage() {
  const world = parseMapFile(worldMapFile);
  return <MapWorkspace initialMap={world} />;
}
