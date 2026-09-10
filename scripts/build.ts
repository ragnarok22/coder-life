import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build, createServer } from "vite";

await build();

// Render the real menu at build time; hosting still only needs static files.
const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, watch: null, ws: false },
  appType: "custom",
});
try {
  const { render }: { render: () => string } = await server.ssrLoadModule(
    "/src/prerender.ts",
  );
  const file = resolve(server.config.root, server.config.build.outDir, "index.html");
  const template = await readFile(file, "utf8");
  if (!template.includes("<!--app-html-->")) {
    throw new Error("Missing prerender outlet in index.html");
  }
  await writeFile(file, template.replace("<!--app-html-->", () => render()));
  console.info("Prerendered the Coder-Life landing page.");
} finally {
  await server.close();
}
