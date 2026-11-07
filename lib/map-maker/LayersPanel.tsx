"use client";

import type { MapLayer } from "./format";
import { usePopover } from "./usePopover";
import toolbar from "./Toolbar.module.css";
import styles from "./LayersPanel.module.css";

type LayersPanelProps = {
  layers: MapLayer[];
  // The positions (in `layers`) of the layers that are switched off.
  hidden: ReadonlySet<number>;
  onToggle: (index: number) => void;
};

// A "Layers" button that opens a small panel with one checkbox per layer. It is a
// popover, not a blocking dialog: the map stays usable behind it. The opening and
// closing (Escape, outside click) comes from the shared usePopover hook.
export default function LayersPanel({ layers, hidden, onToggle }: LayersPanelProps) {
  const { open, setOpen, rootRef, toggleRef, focusRef, panelId } =
    usePopover<HTMLInputElement>();

  const visibleCount = layers.length - hidden.size;

  return (
    <div className={toolbar.root} ref={rootRef}>
      <button
        type="button"
        ref={toggleRef}
        className={toolbar.button}
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
        <div id={panelId} className={toolbar.panel} role="dialog" aria-label="Layers">
          <h2 className={toolbar.panelTitle}>Layers</h2>
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
                      ref={row === 0 ? focusRef : undefined}
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
