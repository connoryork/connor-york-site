"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { DownloadIcon, UploadIcon } from "./icons";
import LayersPanel from "./LayersPanel";
import MapCanvas from "./MapCanvas";
import MapPicker from "./MapPicker";
import styles from "./MapWorkspace.module.css";
import toolbar from "./Toolbar.module.css";
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
  // Which layers (by position in map.layers) are switched off. A Set, because the
  // question we ask is "is this one hidden?".
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<number>>(new Set());
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
    setHiddenLayers(new Set()); // a different map starts with every layer showing
    setError(null);
  }

  function toggleLayer(index: number) {
    setHiddenLayers((current) => {
      // Never edit the old Set: make a copy, change the copy, return it.
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
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
          <h2 className={styles.sectionTitle}>Current map</h2>
          <p className={styles.mapName}>{map.name}</p>
          <dl className={styles.facts}>
            <dt>Projection</dt>
            <dd>{map.projection}</dd>
            <dt>Layers</dt>
            <dd>{map.layers.length}</dd>
          </dl>
        </section>
      </aside>

      {/* The map file picks its own background color, so this one value is set
          inline; everything else about the layout lives in the CSS module. */}
      <main className={styles.stage} style={{ background: map.background }}>
        <div className={toolbar.toolbar}>
          <MapPicker
            library={library}
            selectedId={selectedId}
            loadingId={loadingId}
            onChoose={handleEntryChosen}
          />
          {/* Keyed like the canvas, so a newly shown map gets a closed panel. */}
          <LayersPanel
            key={mapKey}
            layers={map.layers}
            hidden={hiddenLayers}
            onToggle={toggleLayer}
          />
          {/* Upload. The real <input> is visually hidden; clicking this label
              opens the file picker, so the label can look like an icon button.
              The hidden text gives screen readers a name for it. */}
          <label className={toolbar.iconButton} title="Open a map file">
            <UploadIcon />
            <span className={toolbar.visuallyHidden}>Open a map file</span>
            <input
              className={toolbar.visuallyHidden}
              type="file"
              accept=".json"
              onChange={handleFileChosen}
            />
          </label>
          <button
            type="button"
            className={toolbar.iconButton}
            title="Download map"
            aria-label="Download map"
            onClick={() => downloadMap(map)}
          >
            <DownloadIcon />
          </button>
        </div>

        {error && (
          <div role="alert" className={styles.errorToast}>
            <pre className={styles.errorText}>{error}</pre>
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Dismiss this message"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}
        <MapCanvas key={`canvas-${mapKey}`} map={map} hiddenLayers={hiddenLayers} />
      </main>
    </div>
  );
}
