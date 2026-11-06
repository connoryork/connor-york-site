"use client";

import { useRef, useState, type ChangeEvent } from "react";
import MapCanvas from "./MapCanvas";
import styles from "./MapWorkspace.module.css";
import { parseMapFile, type MapFile } from "./format";
import { downloadMap } from "./download";
import type { LibraryEntry } from "./library";

type MapWorkspaceProps = {
  // The built-in maps to list in the sidebar.
  library: LibraryEntry[];
  // The library entry shown first, and its already-loaded map (so showing it
  // needs no download).
  initialEntryId: string;
  initialMap: MapFile;
};

// The page around the map: a sidebar of controls, plus the map itself.
// This is a client component ("use client" above) because it needs state (which
// map is showing) and event handlers (a map was picked, a file was chosen).
export default function MapWorkspace({
  library,
  initialEntryId,
  initialMap,
}: MapWorkspaceProps) {
  const [map, setMap] = useState<MapFile>(initialMap);
  // Which library entry is showing; null when the map came from a user's file.
  const [selectedId, setSelectedId] = useState<string | null>(initialEntryId);
  // Bumped each time a map is shown. It is used as the canvas's React "key": when
  // a key changes React throws the old component away and starts a fresh one, so
  // each newly shown map starts with the view reset (not panned).
  const [mapKey, setMapKey] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loading a map takes time, so answers can arrive out of order: click A, then
  // B, and A's answer might land after B's. Each request takes a number; only
  // the newest number is allowed to change what is on screen. A ref (unlike
  // state) can be changed without re-rendering, which is what we want here.
  const latestRequest = useRef(0);

  // Every way of showing a map goes through here, so the pieces that must change
  // together (the map, which menu item is highlighted, the canvas key, any old
  // error) can't get out of step.
  function showMap(next: MapFile, entryId: string | null) {
    setMap(next);
    setSelectedId(entryId);
    setMapKey((key) => key + 1);
    setError(null);
  }

  async function handleEntryChosen(entry: LibraryEntry) {
    const requestId = ++latestRequest.current;

    // The first map was already loaded by the server; no need to fetch it.
    if (entry.id === initialEntryId) {
      showMap(initialMap, entry.id);
      setLoadingId(null);
      return;
    }

    setLoadingId(entry.id);
    try {
      const response = await fetch(entry.url);
      if (!response.ok) {
        throw new Error(`Could not load "${entry.name}" (HTTP ${response.status}).`);
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new Error(`"${entry.name}" is not valid JSON.`);
      }
      const loaded = parseMapFile(json);

      if (requestId !== latestRequest.current) return; // a newer choice won
      showMap(loaded, entry.id);
    } catch (e) {
      if (requestId !== latestRequest.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (requestId === latestRequest.current) setLoadingId(null);
    }
  }

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    // Choosing a file overrides any library map that is still loading.
    latestRequest.current++;
    setLoadingId(null);

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
      showMap(parseMapFile(json), null);
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
          <h2 className={styles.sectionTitle}>Maps</h2>
          <ul className={styles.libraryList}>
            {library.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={styles.libraryItem}
                  // aria-current tells screen readers which item is selected.
                  aria-current={entry.id === selectedId ? "true" : undefined}
                  disabled={loadingId !== null}
                  onClick={() => handleEntryChosen(entry)}
                >
                  <span className={styles.libraryName}>
                    {entry.name}
                    {entry.id === loadingId && " (loading…)"}
                  </span>
                  <span className={styles.libraryDescription}>
                    {entry.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

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
        <MapCanvas key={mapKey} map={map} />
      </main>
    </div>
  );
}
