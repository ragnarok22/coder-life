import { test, expect } from "@playwright/test";

test("camera rays track endpoints without streaming position buffers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await page.getByRole("button", { name: "Development tools" }).click();
  await page.getByLabel("Office overview", { exact: true }).check();
  await page.getByLabel("Camera collision rays", { exact: true }).check();

  const samples = await page.evaluate(async () => {
    const source = (path: string) =>
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => new URL(url).pathname === path)
        .at(-1) ?? path;
    const { _roots } = await import(
      /* @vite-ignore */ source(
        "/node_modules/.vite/deps/@react-three_fiber.js",
      )
    );
    const {
      BufferAttribute,
      BufferGeometry,
      LineBasicMaterial,
      LineSegments,
      OrthographicCamera,
      Scene,
      WebGLRenderTarget,
    } = await import(
      /* @vite-ignore */ source("/node_modules/.vite/deps/three.js")
    );
    const { runtime } = await import(
      /* @vite-ignore */ source("/src/game/runtime.ts")
    );
    const state = _roots.get(document.querySelector("canvas")).store.getState();
    let rays: InstanceType<typeof LineSegments> | undefined;
    state.scene.traverse((object: InstanceType<typeof LineSegments>) => {
      if (object.isLineSegments && object.renderOrder === 50) rays = object;
    });
    if (!rays) throw new Error("Camera rays did not mount");

    state.setFrameloop("never");
    const attribute = rays.geometry.getAttribute("position");
    const version = attribute.version;
    const camera = new OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    const scene = new Scene();
    scene.fog = state.scene.fog;
    const actual = new LineSegments(rays.geometry, rays.material);
    actual.frustumCulled = false;
    const referenceGeometry = new BufferGeometry();
    referenceGeometry.setAttribute(
      "color",
      rays.geometry.getAttribute("color").clone(),
    );
    const referenceMaterial = new LineBasicMaterial({
      vertexColors: true,
      depthTest: false,
    });
    const reference = new LineSegments(referenceGeometry, referenceMaterial);
    reference.frustumCulled = false;
    const target = new WebGLRenderTarget(96, 96);
    const previousTarget = state.gl.getRenderTarget();
    const pixels = () => {
      state.gl.setRenderTarget(target);
      state.gl.render(scene, camera);
      const result = new Uint8Array(96 * 96 * 4);
      state.gl.readRenderTargetPixels(target, 0, 0, 96, 96, result);
      return result;
    };
    const results = [];
    try {
      for (const [index, endpoints] of [
        [
          [0, 0, 0],
          [3, 2, 0],
          [-2, 1, 0],
        ],
        [
          [1, -1, 0],
          [-3, 2, 0],
          [2, 3, 0],
        ],
      ].entries()) {
        const [origin, desired, position] = endpoints;
        runtime.camera.target.splice(0, 3, ...origin);
        runtime.camera.desired.splice(0, 3, ...desired);
        runtime.camera.position.splice(0, 3, ...position);
        state.advance(index + 1);
        referenceGeometry.setAttribute(
          "position",
          new BufferAttribute(
            new Float32Array([...origin, ...desired, ...origin, ...position]),
            3,
          ),
        );
        scene.add(actual);
        const actualPixels = pixels();
        scene.remove(actual);
        scene.add(reference);
        const referencePixels = pixels();
        scene.remove(reference);
        results.push({
          positionUploads: attribute.version - version,
          mismatchedChannels: actualPixels.filter(
            (value, offset) => value !== referencePixels[offset],
          ).length,
          coloredChannels: referencePixels.filter(
            (value, offset) => offset % 4 !== 3 && value !== 0,
          ).length,
        });
      }
    } finally {
      state.gl.setRenderTarget(previousTarget);
      target.dispose();
      referenceGeometry.dispose();
      referenceMaterial.dispose();
      state.setFrameloop("always");
    }
    return results;
  });

  for (const sample of samples) {
    expect(sample.coloredChannels).toBeGreaterThan(0);
    expect(sample.mismatchedChannels).toBe(0);
    expect(sample.positionUploads).toBe(0);
  }
  expect(errors).toEqual([]);
});
