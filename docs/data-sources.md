# Data sources

The built-in maps in `public/atlas/` come from these sources.

| Map | Source | License |
| --- | --- | --- |
| World | [Natural Earth](https://www.naturalearthdata.com) 1:110m "Land" | Public domain |
| United States | [Natural Earth](https://www.naturalearthdata.com) 1:50m "Admin 1 - States, Provinces", filtered to the US | Public domain |
| Archipelago | Made up for this project | n/a |

The US map is built by `scripts/build-usa-map.ts`, which downloads the source, keeps
only the US states, rounds coordinates to 3 decimals (about 100 m) and writes the map
file.
