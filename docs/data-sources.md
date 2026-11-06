# Data sources

The built-in maps in `public/atlas/` come from these sources.

| Map | Source | License |
| --- | --- | --- |
| World | [Natural Earth](https://www.naturalearthdata.com) 1:110m "Land" | Public domain |
| Roman Mediterranean, c. 120 CE | [Natural Earth](https://www.naturalearthdata.com) 1:50m "Admin 0 - Countries", **modern** shapes used as stand-ins, some cut to boxes | Public domain (the selection and cuts are original to this project) |
| Middle East | [Natural Earth](https://www.naturalearthdata.com) 1:50m "Admin 0 - Countries", 34 countries | Public domain |
| United States | [Natural Earth](https://www.naturalearthdata.com) 1:50m "Admin 1 - States, Provinces", filtered to the US | Public domain |
| Site icon (`app/icon.svg`) | Drawn by `scripts/build-icon.ts` from the World map above | Public domain data; drawing made for this project |
| Archipelago | Made up for this project | n/a |

The US and Middle East maps are built by `scripts/build-usa-map.ts` and
`scripts/build-middle-east-map.ts`. Each downloads its source, keeps only the features it
needs, rounds coordinates (`scripts/geo-clean.ts`) and writes the map file. Run one with
`npx tsx scripts/<name>.ts`.

**The Roman Mediterranean map is schematic, not a historical dataset.** It colors modern
countries (or rough boxes cut from them, such as Britain south of Hadrian's Wall) to
convey the Empire's extent around 120 CE. The countries and boxes are listed in
`scripts/build-antiquity-map.ts`, and the borders are approximate. A historical dataset
with real ancient frontiers was considered and not used because its license is GPL-3.0.

Borders: Natural Earth draws borders as they exist in practice ("de facto"), so disputed
areas appear that way. The maps take no position on any dispute.
