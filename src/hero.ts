// hero.ts
import { heroui } from "@heroui/react";

/**
 * HeroUI is now used only by the provider — every visible control is the
 * project's own. This mapping exists so any library surface that does
 * appear inherits the Accession Card palette rather than stock defaults.
 */
export default heroui({
  themes: {
    light: {
      extend: "light",
      colors: {
        background: "#F7F4EF",
        foreground: "#1A1613",
        content1: "#FFFFFF",
        content2: "#EFEBE4",
        divider: "#E4DFD6",
        focus: "#E4572E",
        primary: { DEFAULT: "#E4572E", foreground: "#FFFFFF" },
      },
    },
    dark: {
      extend: "dark",
      colors: {
        background: "#0B0A0A",
        foreground: "#F5F1EA",
        content1: "#141211",
        content2: "#1C1917",
        divider: "#292827",
        focus: "#E4572E",
        primary: { DEFAULT: "#E4572E", foreground: "#FFFFFF" },
      },
    },
  },
  layout: {
    // Archival, not rounded-app: a mounted plate has a crisp edge.
    radius: { small: "2px", medium: "3px", large: "4px" },
    borderWidth: { small: "1px", medium: "1px", large: "1.5px" },
  },
});
