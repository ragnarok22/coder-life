import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { seoPlugin } from "./scripts/seo.ts";

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), seoPlugin(loadEnv(mode, process.cwd(), "SITE_").SITE_URL)],
  resolve: {
    alias: [
      {
        find: /^@dimforge\/rapier3d-compat$/,
        replacement: fileURLToPath(
          new URL("./src/rendering/rapier.ts", import.meta.url),
        ),
      },
    ],
  },
  // Let Vite load Rapier's native WASM module instead of prebundling it.
  optimizeDeps: { exclude: ["@dimforge/rapier3d"] },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Keep React and gameplay dependencies behind their existing lazy boundaries.
          includeDependenciesRecursively: false,
          groups: [
            {
              name: "three-core",
              test: /[\\/]node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/,
            },
            {
              name: "three-renderer",
              test: /[\\/]node_modules[\\/]three[\\/]build[\\/]three\.module\.js$/,
            },
          ],
        },
      },
    },
  },
}));
