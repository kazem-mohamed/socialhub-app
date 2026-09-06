import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendors that every route needs are split so they cache independently
        // of app code and download in parallel. Route chunks come from the
        // React.lazy calls in the router.
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          query: ["@tanstack/react-query"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          motion: ["framer-motion"],
          http: ["axios"],
          // @heroui/react is deliberately NOT grouped: leaving it to Rollup
          // lets tree-shaking keep the calendar and date-picker out of the
          // always-loaded chunk and inside the register route instead.
        },
      },
    },
  },
});
