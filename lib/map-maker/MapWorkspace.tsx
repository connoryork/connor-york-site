"use client";

import { useState, type ChangeEvent } from "react";
import MapViewer from "./MapViewer";
import styles from "./MapWorkspace.module.css";
import { parseMapFile, type MapFile } from "./format";
import { downloadMap } from "./download";

type MapWorkspaceProps = {
  // The map to show until the user loads one of their own.
  initialMap: MapFile;
};

// The page around the map: a toolbar with a file picker, plus the map itself.
// This is a client component ("use client" above) because it needs state (which
// map is showing) and an event handler (a file was chosen).
export default function MapWorkspace({ initialMap }: MapWorkspaceProps) {
  const [map, setMap] = useState<MapFile>(initialMap);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    // Everything below runs in the user's browser: the file is never uploaded
    // anywhere, we just read it from their disk.
    try {
      const text = await file.text();

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`"${file.name}" is not valid JSON.`);
      }

      // Same validation the server uses; throws a readable error if invalid.
      setMap(parseMapFile(json));
      setError(null);
    } catch (e) {
      // Keep showing the previous map and explain what went wrong.
      setError(e instanceof Error ? e.message : String(e));
    }

    // Clear the input so choosing the same file again still fires onChange.
    input.value = "";
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Map controls">
        <h1 className={styles.brand}>Map Maker</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current map</h2>
          <p className={styles.mapName}>{map.name}</p>
          <dl className={styles.facts}>
            <dt>Projection</dt>
            <dd>{map.projection}</dd>
            <dt>Layers</dt>
            <dd>{map.layers.length}</dd>
          </dl>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>File</h2>
          {/* The <input> is visually hidden; clicking this label opens the file
              picker, so we can style it like a button. */}
          <label className={`${styles.button} ${styles.primary}`}>
            Open a map file…
            <input
              className={styles.visuallyHidden}
              type="file"
              accept=".json"
              onChange={handleFileChosen}
            />
          </label>
          <button
            type="button"
            className={styles.button}
            onClick={() => downloadMap(map)}
          >
            Download map
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => setMap(initialMap)}
          >
            Back to world map
          </button>
          {error && (
            <pre role="alert" className={styles.error}>
              {error}
            </pre>
          )}
        </section>
      </aside>

      {/* The map file picks its own background color, so this one value is set
          inline; everything else about the layout lives in the CSS module. */}
      <main className={styles.stage} style={{ background: map.background }}>
        <MapViewer map={map} />
      </main>
    </div>
  );
}
