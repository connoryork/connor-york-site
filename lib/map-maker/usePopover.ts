import { useEffect, useId, useRef, useState } from "react";

// The open/close behavior shared by the toolbar's dropdowns (Layers, Maps): a
// button opens a panel, and the panel closes on Escape, on a second click of the
// button, or on a click anywhere outside it.
//
// A custom hook is just a function whose name starts with "use" and that calls
// other hooks. It lets two components share behavior without sharing markup.
//
// F is the kind of element to focus when the panel opens (a checkbox, a button...).
export function usePopover<F extends HTMLElement = HTMLElement>() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null); // wraps the button and the panel
  const toggleRef = useRef<HTMLButtonElement>(null);
  const focusRef = useRef<F>(null); // attach to the element that should get focus
  // A unique id so the button can say which element it controls.
  const panelId = useId();

  // While the panel is open: close on Escape or on a press outside it, and move
  // keyboard focus into it so it can be used without a mouse.
  useEffect(() => {
    if (!open) return;
    focusRef.current?.focus();

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

  return { open, setOpen, rootRef, toggleRef, focusRef, panelId };
}
