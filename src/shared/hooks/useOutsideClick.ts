import { useEffect, type RefObject } from "react";

/**
 * Closes a popover when the pointer goes down outside it, or Escape is pressed.
 * Replaces three near-identical listener effects in PostCard and the comment
 * menu.
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  isEnabled = true,
): void {
  useEffect(() => {
    if (!isEnabled) return;

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onOutside();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOutside();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, onOutside, isEnabled]);
}
