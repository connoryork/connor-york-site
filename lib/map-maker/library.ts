// The built-in maps offered in the sidebar. Each is a map file in public/atlas/.
// Anything in public/ is served as-is by Next.js, so /atlas/world.map.json in
// the browser is the file public/atlas/world.map.json on disk.
//
// This list is only the menu (names and where to find each file). The map files
// themselves are fetched when picked, so the page doesn't carry every map.
export type LibraryEntry = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export const library: LibraryEntry[] = [
  {
    id: "world",
    name: "World",
    description: "Coastlines of the modern world",
    url: "/atlas/world.map.json",
  },
  {
    id: "roman-mediterranean",
    name: "Roman Mediterranean, c. 120 CE (schematic)",
    description: "The Empire at its height, sketched from modern country shapes",
    url: "/atlas/roman-mediterranean.map.json",
  },
  {
    id: "middle-east",
    name: "Middle East",
    description: "From Turkey and Egypt to Iran and Oman",
    url: "/atlas/middle-east.map.json",
  },
  {
    id: "usa",
    name: "United States",
    description: "The 50 states and DC, Alaska and Hawaii as insets",
    url: "/atlas/usa.map.json",
  },
  {
    id: "archipelago",
    name: "Archipelago (example)",
    description: "A small made-up map with filled islands",
    url: "/atlas/archipelago.map.json",
  },
];
