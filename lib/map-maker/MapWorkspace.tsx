"use client";

import { useState, type ChangeEvent } from "react";
import MapViewer from "./MapViewer";
import { parseMapFile, type MapFile } from "./format";

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
    <main
      style={{
        background: map.background,
        minHeight: "100vh",
        padding: "2rem",
        color: "#d4a64a",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>{map.name}</h1>
        <label>
          Open a map file:{" "}
          <input type="file" accept=".json" onChange={handleFileChosen} />
        </label>
        <button type="button" onClick={() => setMap(initialMap)}>
          Back to world map
        </button>
      </div>

      {error && (
        <pre
          role="alert"
          style={{
            color: "#ff8a80",
            whiteSpace: "pre-wrap",
            marginBottom: "1rem",
          }}
        >
          {error}
        </pre>
      )}

      <MapViewer map={map} />
    </main>
  );
}
