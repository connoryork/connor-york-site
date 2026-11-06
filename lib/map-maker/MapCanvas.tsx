"use client";

import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { MapFile } from "./format";
import MapViewer from "./MapViewer";
import styles from "./MapCanvas.module.css";
import { IDENTITY_VIEW, MAP_WIDTH, isIdentity, panBy, type View } from "./view";

// How far one arrow-key press moves the map, in map units.
const KEY_STEP = 40;

type MapCanvasProps = {
  map: MapFile;
};

// A map you can move around: drag it with the mouse or a finger, or use the arrow
// keys. It owns the "camera" (the view) and hands it to MapViewer to draw. It is a
// client component because it needs state and event handlers.
export default function MapCanvas({ map }: MapCanvasProps) {
  const [view, setView] = useState<View>(IDENTITY_VIEW);
  const [dragging, setDragging] = useState(false);

  // Where the pointer was at the last move event, or null when not dragging. It
  // lives in a ref because it changes on every move and nothing needs to redraw
  // because of it.
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return; // left mouse button, a finger, or a pen
    // "Capture" the pointer so we keep receiving move events even if it leaves
    // this element mid-drag.
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const last = lastPointer.current;
    if (!last) return;

    // Pointer movement is in screen pixels, but the view is in map units. The map
    // is 960 units wide and drawn as wide as this element is in pixels.
    const unitsPerPixel =
      MAP_WIDTH / event.currentTarget.getBoundingClientRect().width;
    const dx = (event.clientX - last.x) * unitsPerPixel;
    const dy = (event.clientY - last.y) * unitsPerPixel;

    lastPointer.current = { x: event.clientX, y: event.clientY };
    setView((current) => panBy(current, dx, dy));
  }

  function handlePointerEnd() {
    lastPointer.current = null;
    setDragging(false);
  }

  // Arrow keys pan, so the map is usable without a mouse. Pressing Right moves
  // the camera right, which slides the map left.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [KEY_STEP, 0],
      ArrowRight: [-KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault(); // otherwise the arrow keys would also scroll the page
    setView((current) => panBy(current, move[0], move[1]));
  }

  return (
    <div className={styles.frame}>
      <div
        className={`${styles.canvas} ${dragging ? styles.dragging : ""}`}
        role="group"
        aria-label={`${map.name}. Drag or use the arrow keys to move the map.`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
      >
        <MapViewer map={map} view={view} />
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          disabled={isIdentity(view)}
          onClick={() => setView(IDENTITY_VIEW)}
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
