export type Theme = "light" | "dark";

const STORAGE_KEY = "aura-theme";

/** Reads whatever the pre-paint script in index.html already resolved. */
export function readTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

/** True only while the visitor has made no explicit choice. */
export function isFollowingSystem(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

/**
 * Flips the theme.
 *
 * The change is staged through a view transition clipped to a circle that
 * grows from the control the visitor actually pressed, so the new theme
 * arrives from under their finger rather than blinking the whole page.
 * `origin` is the switch's centre in viewport coordinates.
 */
export function setTheme(next: Theme, origin?: { x: number; y: number }): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // A private window can refuse storage; the theme still applies for
    // this session.
  }

  const root = document.documentElement;

  const apply = () => {
    root.setAttribute("data-theme", next);
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || prefersReducedMotion) {
    apply();
    return;
  }

  if (origin) {
    root.style.setProperty("--theme-origin-x", `${origin.x}px`);
    root.style.setProperty("--theme-origin-y", `${origin.y}px`);
  }
  root.classList.add("theme-switching");

  const transition = document.startViewTransition(apply);

  // A ViewTransition exposes three promises, and an interrupted transition
  // — a second toggle, or a navigation starting mid-flip — rejects
  // `ready` as well as `finished`. Any one left unattached surfaces as an
  // unhandled InvalidStateError, so all three are silenced; the theme
  // attribute is applied by the callback regardless of the animation.
  const ignore = () => {};
  transition.ready.catch(ignore);
  transition.updateCallbackDone.catch(ignore);
  transition.finished.catch(ignore).finally(() => {
    root.classList.remove("theme-switching");
  });
}

/**
 * Keeps an untouched install in step with the OS. Once someone picks a
 * theme by hand their choice wins, so the listener stops mattering.
 */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (event: MediaQueryListEvent) => {
    if (!isFollowingSystem()) return;
    const next: Theme = event.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    onChange(next);
  };

  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
