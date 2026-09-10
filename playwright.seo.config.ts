import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "seo.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:4187",
    channel: "chrome",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "pnpm build && pnpm preview --host 127.0.0.1 --port 4187 --strictPort",
    url: "http://127.0.0.1:4187",
    env: { SITE_URL: "https://example.com/coder-life/" },
    reuseExistingServer: false,
  },
});
