import { readdir, stat } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const canonical = "https://example.com/coder-life/";

test("production JavaScript chunks stay within the 500 kB budget", async () => {
  const assets = new URL("../dist/assets/", import.meta.url);
  const files = await readdir(assets);
  const scripts = files.filter((file) => file.endsWith(".js"));
  expect(scripts.length).toBeGreaterThan(0);
  for (const file of scripts) {
    const { size } = await stat(new URL(file, assets));
    expect(
      size,
      `${file} exceeds the minified JavaScript budget`,
    ).toBeLessThanOrEqual(500_000);
  }
  expect(files.filter((file) => file.endsWith(".wasm"))).toHaveLength(1);
});

test("production HTML is readable without JavaScript and includes complete SEO metadata", async ({
  browser,
  request,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Coder-Life" }),
  ).toBeVisible();
  await expect(
    page.getByText("A free 3D developer simulator in your browser.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Enable JavaScript to play Coder-Life/),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "Coder-Life — Free 3D Developer Simulator Browser Game",
  );
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonical,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    canonical,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${canonical}social-preview.png`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "null",
  );
  expect(structuredData).toMatchObject({
    "@type": "VideoGame",
    name: "Coder-Life",
    url: canonical,
  });
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain(`Sitemap: ${canonical}sitemap.xml`);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain(`<loc>${canonical}</loc>`);
  const image = await request.get("/social-preview.png");
  expect(image.headers()["content-type"]).toContain("image/png");
  const bytes = await image.body();
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
  await context.close();
});

test("the prerendered menu becomes interactive on desktop and mobile", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const requestedAssets: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requestedAssets.push(request.url()));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.locator(".menu-canvas canvas")).toBeVisible();
  expect(
    requestedAssets.filter((url) => /rapier|\.wasm|glb-character/.test(url)),
  ).toEqual([]);
  await page.getByRole("button", { name: "About the game" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("seo-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Coder-Life" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("seo-mobile.png"),
    fullPage: true,
  });
  const wasmResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(".wasm"),
  );
  await page.getByRole("button", { name: "New game", exact: true }).click();
  const wasm = await wasmResponse;
  expect(wasm.ok()).toBe(true);
  expect(wasm.headers()["content-type"]).toContain("application/wasm");
  expect(new URL(wasm.url()).origin).toBe(new URL(page.url()).origin);
  expect((await wasm.body()).subarray(0, 4).toString("hex")).toBe("0061736d");
  await expect(page.getByRole("button", { name: /Get up/ })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator(".game-shell canvas")).toBeVisible();
  expect(requestedAssets.filter((url) => /glb-character/.test(url))).toEqual(
    [],
  );
  expect(errors).toEqual([]);
});

test("native physics loads and moves the player from a deployment subdirectory", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Mount the same static output below a prefix, as a subdirectory host would.
  const prefix = "/games/coder-life/";
  await page.route(`**${prefix}**`, async (route) => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace(prefix, "/");
    await route.fulfill({ response: await route.fetch({ url: url.href }) });
  });
  await page.goto(prefix);
  await expect(page.locator(".menu-canvas canvas")).toBeVisible();
  const wasmResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(".wasm"),
  );
  await page.getByRole("button", { name: "New game", exact: true }).click();
  const wasm = await wasmResponse;
  expect(wasm.ok()).toBe(true);
  expect(new URL(wasm.url()).pathname).toMatch(
    /^\/games\/coder-life\/assets\/.+\.wasm$/,
  );
  await page.getByRole("button", { name: /Get up/ }).click();
  const player = page
    .getByRole("img", { name: /Local map/ })
    .locator("circle[stroke]");
  await expect(player).toHaveAttribute("cy", /-?\d/);
  const startZ = Number(await player.getAttribute("cy"));
  await expect
    .poll(async () => {
      await page.keyboard.press("s", { delay: 150 });
      return Number(await player.getAttribute("cy"));
    })
    .toBeGreaterThan(startZ + 0.25);
  expect(errors).toEqual([]);
});
