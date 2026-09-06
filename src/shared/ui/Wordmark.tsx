import { useLayoutEffect, useRef } from "react";

interface WordmarkProps {
  /** "full" = "Aura" + dot (needs room for the whole word). "mono" = "A" + dot only (small square contexts: nav slot, app icon, favicon-scale). */
  variant?: "full" | "mono";
  /** Tailwind width classes on the wrapper control final size — the SVG is vector and fills it. */
  className?: string;
  /** Recolour the wordmark text (dot always stays Vermilion) — e.g. "currentColor" for 1-colour contexts. */
  color?: string;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const DOT_COLOR = "#E4572E";

/**
 * The Aura wordmark (docs/brand-guidelines.md §1): "Aura" set in Bricolage
 * Grotesque 800, closed by a Vermilion dot sized and placed from a
 * *measured* x-height — not a fixed pixel offset — so it reproduces
 * correctly at any size this component is asked to render at.
 */
export function Wordmark({ variant = "full", className, color }: WordmarkProps) {
  const hostRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const word = variant === "mono" ? "A" : "Aura";
    const fontSize = 100;

    host.innerHTML = "";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.overflow = "visible";
    svg.style.display = "block";
    if (color) svg.style.color = color;
    host.appendChild(svg);

    const text = document.createElementNS(SVG_NS, "text");
    text.textContent = word;
    text.setAttribute("font-family", "'Bricolage Grotesque', Inter, sans-serif");
    text.setAttribute("font-weight", "800");
    text.setAttribute("font-size", String(fontSize));
    text.style.letterSpacing = "-3px";
    text.setAttribute("fill", "currentColor");
    text.setAttribute("x", "0");
    text.setAttribute("y", "0");
    svg.appendChild(text);

    // throwaway lowercase glyph, same font/size, read only for its height
    // as an x-height proxy — never rendered, removed before final measure.
    const xh = document.createElementNS(SVG_NS, "text");
    xh.textContent = "u";
    xh.setAttribute("font-family", "'Bricolage Grotesque', Inter, sans-serif");
    xh.setAttribute("font-weight", "800");
    xh.setAttribute("font-size", String(fontSize));
    xh.setAttribute("x", "-9999");
    xh.setAttribute("y", "0");
    svg.appendChild(xh);
    const xHeight = xh.getBBox().height || fontSize * 0.52;
    svg.removeChild(xh);

    const tb = text.getBBox();
    text.setAttribute("transform", `translate(${-tb.x}, ${-tb.y})`);
    const w = tb.width;
    const h = tb.height;

    const dotR = xHeight * 0.16;
    const gap = xHeight * 0.3;
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", String(w + gap + dotR));
    dot.setAttribute("cy", String(h - xHeight * 0.5));
    dot.setAttribute("r", String(dotR));
    dot.setAttribute("fill", DOT_COLOR);
    svg.appendChild(dot);

    const box = svg.getBBox();
    const pad = fontSize * 0.14;
    svg.setAttribute(
      "viewBox",
      `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`,
    );
  }, [variant, color]);

  return <span ref={hostRef} className={className} aria-label="Aura" role="img" />;
}
