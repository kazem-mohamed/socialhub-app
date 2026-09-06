import { useEffect, useRef, useState } from "react";
import { readTheme, setTheme, watchSystemTheme, type Theme } from "@/shared/lib/theme";

/**
 * Gallery lighting.
 *
 * Two states, both named on the control so nobody has to guess which way
 * it goes. Pressing it hands the switch's own position to the view
 * transition, so the new theme opens outward from the button.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setThemeState(readTheme());
    return watchSystemTheme(setThemeState);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const rect = ref.current?.getBoundingClientRect();
    setTheme(
      next,
      rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined,
    );
    setThemeState(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to daylight" : "Switch to night"}
      title={isDark ? "Daylight" : "Night"}
      className={[
        "group/theme relative inline-flex h-7 w-[54px] shrink-0 cursor-pointer items-center",
        "rounded-full border border-rail bg-recess p-0.5",
        "transition-colors duration-200 hover:border-rail-strong",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* The travelling disc — the light itself. */}
      <span
        aria-hidden="true"
        className={[
          "absolute h-[22px] w-[22px] rounded-full bg-plate shadow-sm",
          "transition-transform duration-[280ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
          isDark ? "translate-x-[26px]" : "translate-x-0",
        ].join(" ")}
      />
      <span
        aria-hidden="true"
        className="relative z-10 grid h-[22px] w-[22px] place-items-center"
      >
        <SunGlyph active={!isDark} />
      </span>
      <span
        aria-hidden="true"
        className="relative z-10 ml-[4px] grid h-[22px] w-[22px] place-items-center"
      >
        <MoonGlyph active={isDark} />
      </span>
    </button>
  );
}

function SunGlyph({ active }: { active: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={`transition-colors duration-200 ${active ? "text-ink" : "text-ink-3"}`}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonGlyph({ active }: { active: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-colors duration-200 ${active ? "text-ink" : "text-ink-3"}`}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
