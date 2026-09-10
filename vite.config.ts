import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { seoPlugin } from "./scripts/seo.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), seoPlugin(loadEnv(mode, process.cwd(), "SITE_").SITE_URL)],
}));
