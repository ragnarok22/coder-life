import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "**/node_modules/",
    "**/.pnpm-store/",
    "**/.cache/",
    "**/.vite/",
    "**/.vite-temp/",
    "**/.eslintcache",
    "**/.prettiercache",
    "**/*.tsbuildinfo",
    "**/dist/",
    "**/dist-ssr/",
    "**/build/",
    "**/artifacts/",
    "**/*.tgz",
    "**/coverage/",
    "**/.nyc_output/",
    "**/test-results/",
    "**/playwright-report/",
    "**/blob-report/",
    "**/playwright/.cache/",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);
