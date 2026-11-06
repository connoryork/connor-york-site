"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { MapFile } from "./format";
import MapViewer from "./MapViewer";
import styles from "./MapCanvas.module.css";
import {
  IDENTITY_VIEW,
  MAP_HEIGHT,
  MAP_WIDTH,
  canZoomIn,
  canZoomOut,
  isIdentity,
  panBy,
  zoomAt,
  type View,
} from "./view";

// How far one arrow-key press moves the map, in map units.
const KEY_STEP = 40;
// How much the buttons and the + / - keys zoom per press.
const BUTTON_ZOOM = 1.5;
const DOUBLE_CLICK_ZOOM = 2;
// Wheel zoom: the zoom factor is exp(-scroll * speed), so scrolling up zooms in and
// scrolling down zooms out, and equal scrolls always give equal zoom steps.
const WHEEL_SPEED = 0.002;
// A trackpad pinch arrives as wheel events with ctrlKey set and small amounts.
const PINCH_WHEEL_SPEED = 0.01;

// Pointer movement is in screen pixels, but the view is in map units. The map is
// 960 units wide and drawn as wide as its element is on screen, so one pixel is
// 960 / width units. Measuring at the moment of use keeps this right if the window
// is resized or the layout changes.
function unitsPerPixel(element: HTMLElement): number {
  return MAP_WIDTH / element.getBoundingClientRect().width;
}

// A screen position (clientX/clientY) as a point in map units inside the frame.
function toFrame(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  const scale = MAP_WIDTH / rect.width;
  return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
}

type MapCanvasProps = {
  map: MapFile;
  // Positions of layers to leave out of the drawing.
  hiddenLayers: ReadonlySet<number>;
};

// A map you can move around and zoom: drag, scroll, pinch, double-click, the
// buttons, or the keyboard. It owns the "camera" (the view) and hands it to
// MapViewer to draw. It is a client component because it needs state and event
// handlers.
export default function MapCanvas({ map, hiddenLayers }: MapCanvasProps) {
  const [view, setView] = useState<View>(IDENTITY_VIEW);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Every pointer currently pressed (one mouse button or finger, or two fingers
  // for a pinch), keyed by pointer id. A ref, because it changes on every move
  // and nothing needs to redraw because of it.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // The distance between two fingers at the last move, or null.
  const pinchDistance = useRef<number | null>(null);

  function zoomFromCenter(factor: number) {
    setView((current) => zoomAt(current, factor, MAP_WIDTH / 2, MAP_HEIGHT / 2));
  }

  // Scroll-wheel zoom. This is attached by hand instead of with React's onWheel
  // because React registers wheel handlers as "passive", and a passive handler is
  // not allowed to call preventDefault(), which we need so that scrolling over
  // the map zooms it instead of also scrolling the page.
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const point = toFrame(element!, event.clientX, event.clientY);
      // deltaMode 1 means the amount is in text lines, not pixels.
      const amount = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const speed = event.ctrlKey ? PINCH_WHEEL_SPEED : WHEEL_SPEED;
      setView((current) => zoomAt(current, Math.exp(-amount * speed), point.x, point.y));
    }

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return; // left mouse button, a finger, or a pen
    // "Capture" the pointer so we keep receiving move events even if it leaves
    // this element mid-drag.
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setDragging(true);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return; // not a pointer we are tracking (a hover, say)

    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);
    const element = event.currentTarget;
    const scale = unitsPerPixel(element);

    if (pointers.current.size === 1) {
      // One pointer: drag the map.
      const dx = (current.x - previous.x) * scale;
      const dy = (current.y - previous.y) * scale;
      setView((view) => panBy(view, dx, dy));
    } else if (pointers.current.size === 2) {
      // Two fingers: spreading them zooms (around the point between them), and
      // moving them together drags. This event moved only one finger, so the
      // midpoint moved by half of that finger's movement.
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const lastDistance = pinchDistance.current;
      pinchDistance.current = distance;
      if (!lastDistance || !distance) return;

      const middle = toFrame(element, (a.x + b.x) / 2, (a.y + b.y) / 2);
      const dx = ((current.x - previous.x) / 2) * scale;
      const dy = ((current.y - previous.y) / 2) * scale;
      setView((view) =>
        panBy(zoomAt(view, distance / lastDistance, middle.x, middle.y), dx, dy),
      );
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinchDistance.current = null;
    // If one finger of a pinch lifts, the other carries on as an ordinary drag.
    if (pointers.current.size === 0) setDragging(false);
  }

  function handleDoubleClick(event: MouseEvent<HTMLDivElement>) {
    const point = toFrame(event.currentTarget, event.clientX, event.clientY);
    setView((current) => zoomAt(current, DOUBLE_CLICK_ZOOM, point.x, point.y));
  }

  // Keyboard: arrows pan, + and - zoom, 0 resets. Pressing Right moves the camera
  // right, which slides the map left.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [KEY_STEP, 0],
      ArrowRight: [-KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault(); // otherwise the arrow keys would also scroll the page
      setView((current) => panBy(current, move[0], move[1]));
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomFromCenter(BUTTON_ZOOM);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomFromCenter(1 / BUTTON_ZOOM);
    } else if (event.key === "0") {
      event.preventDefault();
      setView(IDENTITY_VIEW);
    }
  }

  return (
    <div className={styles.frame}>
      <div
        ref={canvasRef}
        className={`${styles.canvas} ${dragging ? styles.dragging : ""}`}
        role="group"
        aria-label={`${map.name}. Drag or use the arrow keys to move the map. Scroll, or press plus and minus, to zoom.`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        <MapViewer map={map} view={view} hiddenLayers={hiddenLayers} />
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          aria-label="Zoom out"
          disabled={!canZoomOut(view)}
          onClick={() => zoomFromCenter(1 / BUTTON_ZOOM)}
        >
          −
        </button>
        <span className={styles.zoomLevel}>×{view.k.toFixed(1)}</span>
        <button
          type="button"
          className={styles.controlButton}
          aria-label="Zoom in"
          disabled={!canZoomIn(view)}
          onClick={() => zoomFromCenter(BUTTON_ZOOM)}
        >
          +
        </button>
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
