import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Object3D, Mesh } from "three";

async function playerPose(page: Page) {
  return page.evaluate(async () => {
    const source = (path: string) =>
      performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((url) => new URL(url).pathname === path)
        .at(-1) ?? path;
    const { _roots } = await import(
      /* @vite-ignore */ source(
        "/node_modules/.vite/deps/@react-three_fiber.js",
      )
    );
    const { Box3, Vector3 } = await import(
      /* @vite-ignore */ source("/node_modules/.vite/deps/three.js")
    );
    const { runtime } = await import(
      /* @vite-ignore */ source("/src/game/runtime.ts")
    );
    const { useGame } = await import(
      /* @vite-ignore */ source("/src/game/store.ts")
    );
    const scene = _roots
      .get(document.querySelector("canvas"))
      ?.store.getState().scene;
    if (!scene) return null;
    scene.updateMatrixWorld(true);
    const rings: Mesh[] = [];
    scene.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (mesh.isMesh && mesh.geometry.type === "RingGeometry")
        rings.push(mesh);
    });
    const ring = rings[0];
    const root: Object3D | undefined =
      scene.getObjectByName("player-character") ?? ring?.parent;
    if (!root) return null;
    const bounds = new Box3();
    let meshes = 0;
    root.traverseVisible((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || mesh === ring) return;
      mesh.geometry.computeBoundingBox();
      bounds.union(
        new Box3()
          .copy(mesh.geometry.boundingBox)
          .applyMatrix4(mesh.matrixWorld),
      );
      meshes++;
    });
    if (!meshes) return null;
    const hips: Object3D[] = [];
    root.traverse((object: Object3D) => {
      if (
        object.name === "left-hip" ||
        (Math.abs(object.position.x + 0.17) < 0.001 &&
          Math.abs(object.position.y - 0.56) < 0.001)
      )
        hips.push(object);
    });
    const hip = hips[0];
    return {
      center: bounds.getCenter(new Vector3()).toArray() as number[],
      size: bounds.getSize(new Vector3()).toArray() as number[],
      min: bounds.min.toArray() as number[],
      hip: hip?.getWorldPosition(new Vector3()).toArray() as
        number[] | undefined,
      legAngle: hip?.rotation.x,
      player: [...runtime.player] as number[],
      animation: runtime.animation as string,
      speed: runtime.speed as number,
      awake: useGame.getState().game.awake as boolean,
      working: useGame.getState().game.working as boolean,
    };
  });
}

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect.poll(async () => !!(await playerPose(page))).toBe(true);
  await page.waitForTimeout(450);
}

async function office(page: Page, position: [number, number]) {
  await page.evaluate(async (position) => {
    const source = (path: string) =>
      performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((url) => new URL(url).pathname === path)
        .at(-1) ?? path;
    const { useGame } = await import(
      /* @vite-ignore */ source("/src/game/store.ts")
    );
    const { runtime } = await import(
      /* @vite-ignore */ source("/src/game/runtime.ts")
    );
    const { changeSceneDebug } = await import(
      /* @vite-ignore */ source("/src/game/scene-debug.ts")
    );
    const state = useGame.getState();
    runtime.player = [...position];
    runtime.npcs.clear();
    useGame.setState({
      screen: "playing",
      game: {
        ...state.game,
        location: "office",
        position,
        awake: true,
        working: false,
        dialogue: null,
        hidingZone: null,
        search: null,
        flags: ["awake", "commute", "printer-intro", "first-manager"],
        nextEventAt: 2000,
        nextCodingAt: 2000,
      },
      revision: state.revision + 1,
      nearest: null,
    });
    changeSceneDebug({ freezeNpcs: true });
  }, position);
  await expect
    .poll(async () => (await playerPose(page))?.center[0])
    .toBeCloseTo(position[0], 1);
  await page.waitForTimeout(400);
}

test("new game shows the player lying on the mattress, then gets up onto clear floor", async ({
  page,
}, info) => {
  await start(page);
  const asleep = (await playerPose(page))!;
  expect(asleep.awake).toBe(false);
  expect(asleep.center[0]).toBeCloseTo(-3.6, 1);
  expect(asleep.center[2]).toBeGreaterThan(-3.5);
  expect(asleep.center[2]).toBeLessThan(-2);
  expect(asleep.size[1]).toBeLessThan(0.9);
  expect(asleep.size[2]).toBeGreaterThan(1.5);
  expect(asleep.min[1]).toBeGreaterThan(0.7);
  await page.screenshot({ path: info.outputPath("sleeping.png") });
  await page.getByRole("button", { name: /Get up/ }).click();
  await expect.poll(async () => (await playerPose(page))?.awake).toBe(true);
  await expect
    .poll(async () => (await playerPose(page))?.size[1])
    .toBeGreaterThan(1.6);
  const awake = (await playerPose(page))!;
  expect(awake.player[0]).toBeCloseTo(-1.7, 1);
  expect(awake.player[1]).toBeCloseTo(-2, 1);
  await page.keyboard.down("s");
  await page.waitForTimeout(350);
  await page.keyboard.up("s");
  expect((await playerPose(page))!.player[1]).toBeGreaterThan(
    awake.player[1] + 0.4,
  );
});

test("working aligns with the real chair from different approach positions and releases cleanly", async ({
  page,
}, info) => {
  await start(page);
  for (const position of [
    [-7.2, 3.9],
    [-4.9, 3.7],
  ] as [number, number][]) {
    await office(page, position);
    await page.getByRole("button", { name: /Sit down & code/ }).click();
    await page.waitForTimeout(650);
    const seated = (await playerPose(page))!;
    // Player desk is (-6, 2); the rendered chair sits 1.16 units in front.
    expect(seated.working).toBe(true);
    expect(seated.center[0]).toBeCloseTo(-6, 1);
    expect(Math.abs(seated.center[2] - 3.16)).toBeLessThan(0.3);
    expect(seated.hip).toBeDefined();
    expect(Math.abs(seated.hip![1] - 0.62)).toBeLessThan(0.06);
    expect(seated.speed).toBeLessThan(0.06);
    await page.screenshot({
      path: info.outputPath(`seated-${position[0]}.png`),
    });
    await page.getByRole("button", { name: /Leave desk/ }).click();
    await page.keyboard.down("s");
    await page.waitForTimeout(400);
    await page.keyboard.up("s");
    expect((await playerPose(page))!.working).toBe(false);
    expect((await playerPose(page))!.player[1]).toBeGreaterThan(3.5);
  }
});

test("an interruption stops running while physics is paused for dialogue", async ({
  page,
}, info) => {
  await start(page);
  await office(page, [0, 6]);
  await page.keyboard.down("w");
  await page.keyboard.down("Shift");
  await expect
    .poll(async () => (await playerPose(page))?.animation)
    .toBe("run");
  await page.evaluate(async () => {
    const path = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .filter((url) => new URL(url).pathname === "/src/game/store.ts")
      .at(-1)!;
    const { useGame } = await import(/* @vite-ignore */ path);
    useGame.getState().interrupt("minute");
  });
  await expect(
    page.getByRole("dialog", { name: "The quick sync" }),
  ).toBeVisible();
  await page.waitForTimeout(450);
  const talking = (await playerPose(page))!;
  expect(talking.animation).toBe("talk");
  expect(talking.speed).toBe(0);
  expect(Math.abs(talking.legAngle ?? Infinity)).toBeLessThan(0.05);
  await page.waitForTimeout(300);
  expect((await playerPose(page))!.player).toEqual(talking.player);
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
  await page.screenshot({ path: info.outputPath("talking.png") });
  await page
    .getByRole("button", { name: /Can you put it in a ticket/ })
    .click();
  await page.waitForTimeout(200);
  expect(["walk", "run"]).not.toContain((await playerPose(page))!.animation);
});
