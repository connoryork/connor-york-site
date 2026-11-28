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
- **Work:** edit `lib/tabs/work/data.json`: `timelineItems` (one per role
  or degree; a promotion is a new item), `badges`, and the `ongoingLabel`
  that marks a role that hasn't ended.

### Adding a tab

A tab is a folder in `lib/tabs/` with a JSON data file and a `tab.ts` that
validates it and lists the tab's sections, top to bottom (see
`lib/tabs/work/tab.ts`):

- `badges(items)`: a Badges Earned shelf. Each badge has a `name`, a `color`
  (`#rrggbb`) for its disc, a `logo` and the month it was `earned`
  (`YYYY-MM`); any other fields show up in its hover card.
- `timeline(items, { name, ongoingLabel })`: a git-style timeline. Each item
  has a `label` and `color` for its branch, and a `start` and `end` (null
  while ongoing), each a day (`YYYY-MM-DD`) or a month (`YYYY-MM`); any
  other fields show up in its hover card.

Then add the tab to `lib/tabs/registry.ts`. Its page is
`/timelines/<slug>` and it appears in the tab bar.

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
