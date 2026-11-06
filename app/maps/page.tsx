import MapWorkspace from "@/lib/map-maker/MapWorkspace";
import { parseMapFile } from "@/lib/map-maker/format";
import { library } from "@/lib/map-maker/library";
import worldMapFile from "@/public/atlas/world.map.json";

// A folder under app/ becomes a URL, so app/maps/page.tsx is served at /maps.
// This page stays thin: it runs on the server, validates the first map, and
// hands it, with the list of built-in maps, to the client component that
// handles interaction. The other maps are fetched when picked.
export default function MapsPage() {
  const world = parseMapFile(worldMapFile);
  return (
    <MapWorkspace library={library} initialEntryId="world" initialMap={world} />
  );
}
