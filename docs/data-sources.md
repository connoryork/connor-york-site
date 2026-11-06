# Data sources

The built-in maps in `public/atlas/` come from these sources.

| Map | Source | License |
| --- | --- | --- |
| World | [Natural Earth](https://www.naturalearthdata.com) 1:110m "Land" | Public domain |
| Middle East | [Natural Earth](https://www.naturalearthdata.com) 1:50m "Admin 0 - Countries", 34 countries | Public domain |
| United States | [Natural Earth](https://www.naturalearthdata.com) 1:50m "Admin 1 - States, Provinces", filtered to the US | Public domain |
| Archipelago | Made up for this project | n/a |

The US and Middle East maps are built by `scripts/build-usa-map.ts` and
`scripts/build-middle-east-map.ts`. Each downloads its source, keeps only the features it
needs, rounds coordinates (`scripts/geo-clean.ts`) and writes the map file. Run one with
`npx tsx scripts/<name>.ts`.

Borders: Natural Earth draws borders as they exist in practice ("de facto"), so disputed
areas appear that way. The maps take no position on any dispute.
