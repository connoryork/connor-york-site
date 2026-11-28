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
- **Work and school:** add an entry per role or degree to
  `lib/work/experience.json` (a promotion is a new entry). Its `org` must be
  listed in `lib/work/orgs.json`.

### Adding a company or school

Each org in `lib/work/orgs.json` has a `name`, a `color` (`#rrggbb`) and a
`logo`. The color fills its badge and draws its branches on the timeline.

The logo is pixel art in `public/logos/`. Make it from any logo image (PNG,
WebP, SVG, JPEG) with:

```bash
npm run pixelate-logo -- path/to/logo.png acme
```

That writes `public/logos/acme.png`; set `"logo": "acme.png"` in `orgs.json`.
It keeps the logo's 2 most common colors; if it looks flat, pass more:

```bash
npm run pixelate-logo -- path/to/logo.png acme 3
```

The result is a 28x28 PNG you can touch up in any pixel editor.
