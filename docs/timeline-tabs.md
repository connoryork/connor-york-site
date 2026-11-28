# Timeline tabs

The Timelines page (`/timelines`) is a row of tabs, and each tab is built
entirely from data. To add a tab, you add a folder with a JSON file. You don't
write any code or touch any routes.

## The pattern

The general part (how to draw a timeline or a badge shelf) is kept apart from
the specific part (my books, my jobs). The data passes through these layers:

```
lib/tabs/work/tab.json            the data: what this tab shows
        │  checked by
lib/tabs/tab.ts                   the tab schema: label, title, sections
lib/tabs/sections/*.ts            one schema + builder per section type
        │  built into plain props, at build time
lib/tabs/TabView.tsx              picks the component for each section
        │  rendered by
lib/timeline/, lib/pixel/         generic components; they know nothing about
                                  books or jobs
```

`app/timelines/[tab]/page.tsx` is the one route for every tab.
`lib/tabs/registry.ts` finds the tabs.

The rules that keep it this way:

- **Generic components take generic input.** `Timeline` takes entries (dates,
  label, color, data) and `BadgeShelf` takes badges. Neither imports anything
  tab-specific. The dependencies only point one way: tabs use components, and
  components never use tabs.
- **Each section type owns its schema.** A section's file in
  `lib/tabs/sections/` defines what its JSON must contain and how to turn that
  into the component's props. The schema is the contract, so a new tab can't
  invent a different shape.
- **Bad data fails the build.** Every `tab.json` is checked with
  [zod](https://zod.dev) as the site builds. A mistake stops the build with a
  message naming the file and field, e.g. `expected YYYY-MM-DD or YYYY-MM`
  at `sections[1].items[0].start` in `lib/tabs/work/tab.json`.
- **Extra fields are welcome.** Items must have the fields their section
  needs. Anything else (a job's team, a book's author) is kept and shown in
  the item's hover card.
- **Sections are independent.** A tab's badges and its timeline don't share
  data. Each section has its own items, even if that repeats a color.

### How Next.js fits in

- **Server components build the data, client components draw it.** Loading
  and checking JSON and building sections run on the server, at build time.
  Only the interactive parts (hover cards, the minimap) are client components,
  and they get plain JSON-like props. Keeping those props plain is also what
  keeps the components generic.
- **Every tab is a static page.** `generateStaticParams` lists every tab, so
  each one is prerendered when the site builds. An unknown tab is a 404.
- **Tabs are found when the site builds.** `import.meta.glob` (a Turbopack
  feature) bundles every `lib/tabs/*/tab.json` into the build. Nothing reads
  folders while serving a request, so it works on any host. The cost is that
  it needs Turbopack, which is the default bundler in this version of Next.js.

## Adding a tab

Create `lib/tabs/<slug>/tab.json`. The folder name becomes the URL
(`/timelines/<slug>`), and tabs appear in the tab bar in folder-name order.
The tab looks like this:

```json
{
  "label": "WORK",
  "title": "Work",
  "description": "My work experience, as a git graph.",
  "sections": [
    { "type": "badges", "items": [] },
    { "type": "timeline", "name": "Work timeline", "ongoingLabel": "CURRENT", "items": [] }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `label` | The tab's name in the tab bar. |
| `title`, `description` | The browser tab title and the search-result summary. |
| `sections` | What the tab shows, top to bottom. Each section has a `type`. |

See `lib/tabs/work/tab.json` for a full example.

## Section types

### `badges`

A Badges Earned shelf of round, achievement-style badges, most recently
earned first. Hovering a badge shows its JSON.

| Field | Meaning |
| --- | --- |
| `title` | Optional heading; defaults to `BADGES EARNED`. |
| `items[].name` | The badge's name. |
| `items[].color` | `#rrggbb`, the badge's disc color. |
| `items[].logo` | A file in `public/logos/` (see below). |
| `items[].earned` | `YYYY-MM`. |

To make a logo, convert any image to pixel art once:

```bash
npm run pixelate-logo -- path/to/logo.png acme
```

That writes `public/logos/acme.png`, a 28x28 image in the logo's 2 most
common colors (pass a third argument for more). You can touch it up in any
pixel editor.

### `timeline`

A git-style timeline: a white baseline with a colored branch for each item,
from its start to its end. Hovering a branch shows the item's JSON.

| Field | Meaning |
| --- | --- |
| `name` | Names the timeline for screen readers. |
| `ongoingLabel` | Tags a branch that hasn't ended, e.g. `CURRENT`. |
| `items[].label` | The branch's label. |
| `items[].color` | `#rrggbb`, the branch's color. |
| `items[].start` | `YYYY-MM-DD` or `YYYY-MM`. |
| `items[].end` | Same, or `null` while ongoing. |

A month counts from its 1st. An item starting `2024-01` starts January 1,
and one ending `2024-01` ends the day before. So when one item ends in the
month the next one starts, like a promotion, its branch merges back just
before the next one branches out, in the same lane.

## Adding a section type

1. In `lib/tabs/sections/<type>.ts`, export:
   - a section schema with `type: z.literal("<type>")`
   - a builder that turns a parsed section into plain props, with its own
     `type`
2. In `lib/tabs/tab.ts`, add the schema to the `sections` union, the builder
   to the `switch` in `loadTab`, and the props type to `Section`.
3. In `lib/tabs/TabView.tsx`, render it.
4. If it needs a new component, put it in `lib/` with generic props, not tied
   to any one tab.

TypeScript flags a type that's in the union but missing from `loadTab`'s
`switch`. It doesn't flag a missing case in `TabView`, which would just render
nothing, so check the page.

## Not on the pattern yet

The **Books** tab (`/timelines/books`) still has its own page. Its data needs
computing: colors are blended from its categories, labels are shortened
titles, and its charts are statistics. The plan is to let a tab add an
optional `tab.ts` that computes sections from its raw data, and to add a
charts section type.
