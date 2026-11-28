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

Add a folder with a `tab.json` to `lib/tabs/`, like `lib/tabs/work/`. The
site finds it when it builds and gives it a page at `/timelines/<folder>`.
See [docs/timeline-tabs.md](docs/timeline-tabs.md) for the format, the
section types, badge logos, and how the pattern works.
