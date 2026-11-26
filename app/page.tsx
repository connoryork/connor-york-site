// The homepage ("/"). Deliberately plain, 90s-style HTML.
// To add a project, add an entry to this list.
const projects = [
  {
    href: "/maps",
    name: "Map Maker",
    description: "draw and explore maps in the browser",
  },
  {
    href: "/books",
    name: "Book log",
    description: "every book I've read, as a git graph and pixel charts",
  },
];

// globals.css resets margins and link styling for the rest of the site;
// this brings the old browser defaults back for this page only.
const css = `
  .home { margin: 16px; font-family: "Times New Roman", Times, serif;
          font-size: 16px; line-height: 1.3; color: #000; background: #c0c0c0; }
  body:has(.home) { background: #c0c0c0; }
  .home h1 { font-size: 2em; margin: 0.67em 0; }
  .home h2 { font-size: 1.5em; margin: 0.83em 0; }
  .home p { margin: 1em 0; }
  .home ul { margin: 1em 0; padding-left: 40px; list-style: disc; }
  .home hr { margin: 0.5em 0; border: 1px inset #808080; }
  .home a { color: #0000ee; text-decoration: underline; }
  .home a:visited { color: #551a8b; }
  .home a:active { color: #ee0000; }
  .home small { font-size: 0.8em; }
`;

export default function Home() {
  return (
    <div className="home">
      <style>{css}</style>

      <h1>Connor York</h1>
      <p>Software Engineer at HubSpot.</p>

      <hr />

      <h2>Projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.href}>
            <a href={p.href}>{p.name}</a> - {p.description}
          </li>
        ))}
      </ul>

      <hr />

      <p>
        <small>
          <a href="https://github.com/connoryork">GitHub</a>
        </small>
      </p>
    </div>
  );
}
