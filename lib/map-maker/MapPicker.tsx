"use client";

import type { KeyboardEvent } from "react";
import { MapIcon } from "./icons";
import type { LibraryEntry } from "./library";
import { usePopover } from "./usePopover";
import toolbar from "./Toolbar.module.css";
import styles from "./MapPicker.module.css";

type MapPickerProps = {
  library: LibraryEntry[];
  // Which library entry is showing now (null for a map opened from a file).
  selectedId: string | null;
  // The entry being fetched right now, if any.
  loadingId: string | null;
  onChoose: (entry: LibraryEntry) => void;
};

// A map-icon button that opens a scrolling list of the built-in maps.
export default function MapPicker({
  library,
  selectedId,
  loadingId,
  onChoose,
}: MapPickerProps) {
  const { open, setOpen, rootRef, toggleRef, focusRef, panelId } =
    usePopover<HTMLButtonElement>();
  const loading = loadingId !== null;
  // When the list opens, keyboard focus lands on the current map (or the first).
  const focusId = selectedId ?? library[0]?.id;

  function choose(entry: LibraryEntry) {
    setOpen(false);
    onChoose(entry);
  }

  // Up and Down move between the maps, wrapping around at the ends.
  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll("button")];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "ArrowDown" ? current + 1 : current - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  return (
    <div className={toolbar.root} ref={rootRef}>
      <button
        type="button"
        ref={toggleRef}
        className={`${toolbar.iconButton} ${loading ? toolbar.busy : ""}`}
        title="Choose a map"
        aria-label="Choose a map"
        aria-expanded={open}
        aria-controls={panelId}
        aria-busy={loading}
        disabled={loading}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <MapIcon />
      </button>

      {open && (
        <div
          id={panelId}
          className={`${toolbar.panel} ${styles.wide}`}
          role="group"
          aria-label="Maps"
        >
          <h2 className={toolbar.panelTitle}>Maps</h2>
          <ul className={styles.list} onKeyDown={handleListKeyDown}>
            {library.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  ref={entry.id === focusId ? focusRef : undefined}
                  className={styles.item}
                  // aria-current tells screen readers which item is selected.
                  aria-current={entry.id === selectedId ? "true" : undefined}
                  onClick={() => choose(entry)}
                >
                  <span className={styles.name}>{entry.name}</span>
                  <span className={styles.description}>{entry.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
