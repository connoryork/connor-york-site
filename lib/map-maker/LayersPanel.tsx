"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MapLayer } from "./format";
import styles from "./LayersPanel.module.css";

type LayersPanelProps = {
  layers: MapLayer[];
  // The positions (in `layers`) of the layers that are switched off.
  hidden: ReadonlySet<number>;
  onToggle: (index: number) => void;
};

// A "Layers" button that opens a small panel with one checkbox per layer. It is a
// popover, not a blocking dialog: the map stays usable behind it, and it closes on
// Escape, on a second click of the button, or on a click anywhere outside it.
export default function LayersPanel({ layers, hidden, onToggle }: LayersPanelProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  // A unique id so the button can say which element it controls.
  const panelId = useId();

  // While the panel is open: close on Escape or on a press outside it, and move
  // keyboard focus into it so it can be used without a mouse.
  useEffect(() => {
    if (!open) return;
    firstCheckboxRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus(); // put focus back where it came from
      }
    }
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const visibleCount = layers.length - hidden.size;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        ref={toggleRef}
        className={styles.toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        Layers
        <span className={styles.count}>
          {visibleCount}/{layers.length}
        </span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel} role="dialog" aria-label="Layers">
          <h2 className={styles.title}>Layers</h2>
          <ul className={styles.list}>
            {/* Listed top layer first, like the layers panel in a design tool.
                Each item remembers its real position (index) in the map. */}
            {layers
              .map((layer, index) => ({ layer, index }))
              .reverse()
              .map(({ layer, index }, row) => (
                <li key={index}>
                  <label className={styles.item}>
                    <input
                      type="checkbox"
                      ref={row === 0 ? firstCheckboxRef : undefined}
                      checked={!hidden.has(index)}
                      onChange={() => onToggle(index)}
                    />
                    <span
                      className={styles.swatch}
                      aria-hidden="true"
                      style={{
                        background: layer.style.fill === "none" ? "transparent" : layer.style.fill,
                        border: `2px solid ${layer.style.stroke}`,
                      }}
                    />
                    {layer.name ?? `Layer ${index + 1}`}
                  </label>
                </li>
              ))}
          </ul>
          <p className={styles.hint}>Hiding a layer doesn&rsquo;t change the saved map.</p>
        </div>
      )}
    </div>
  );
}
