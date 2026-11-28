# connor-york-site

<img src="app/icon.svg" alt="Map Maker icon: a gold globe" width="96" align="right">

Connor York's personal website, built with Next.js: a map-making tool, and timelines of the books I've read and where I've worked.

## Development

Requires the Node version in `.nvmrc`.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Updating the timelines

All timeline data is JSON, checked by a zod schema when the site builds, so a
mistake fails the build with a message saying what's wrong.

- **Books:** add an entry to `lib/book-log/books.json`.
- **Work:** edit `lib/tabs/work/tab.json`.

### Adding a tab

A tab is a `lib/tabs/<slug>/tab.json` with its tab-bar `label`, a page
`title` and `description`, and its `sections`, top to bottom. Each section's
`type` decides what it needs (see `lib/tabs/work/tab.json`):

- `"badges"`: a Badges Earned shelf (optional `title`). Each of its `items`
  has a `name`, a `color` (`#rrggbb`) for its disc, a `logo` and the month
  it was `earned` (`YYYY-MM`).
- `"timeline"`: a git-style timeline with a screen-reader `name` and an
  `ongoingLabel` (e.g. `"CURRENT"`) for branches that haven't ended. Each of
  its `items` has a `label` and `color` for its branch, and a `start` and
  `end` (null while ongoing), each a day (`YYYY-MM-DD`) or a month
  (`YYYY-MM`).

Items can have any other fields; they show up in the item's hover card.
That's all: the site finds every `tab.json` when it builds. The tab's page is
`/timelines/<slug>`, and tabs appear in the tab bar in folder-name order.

### Badge logos

A badge's logo is pixel art in `public/logos/`. Make it from any logo image (PNG,
WebP, SVG, JPEG) with:

```bash
npm run pixelate-logo -- path/to/logo.png acme
```

That writes `public/logos/acme.png`; set `"logo": "acme.png"` on the badge.
It keeps the logo's 2 most common colors; if it looks flat, pass more:

```bash
npm run pixelate-logo -- path/to/logo.png acme 3
```

The result is a 28x28 PNG you can touch up in any pixel editor.
