import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function prepare(page: Page, position: [number, number] = [-6, 3.4]) {
  await page.goto("/");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Development tools" }),
  ).toBeVisible();
  await teleport(page, position);
}
async function teleport(page: Page, position: [number, number]) {
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
    const { nearestWalkable } = await import(
      /* @vite-ignore */ source("/src/ai/navigation.ts")
    );
    const safe = nearestWalkable(position, "office"),
      s = useGame.getState();
    runtime.player = [...safe];
    runtime.npcs.clear();
    useGame.setState({
      game: {
        ...s.game,
        location: "office",
        position: safe,
        awake: true,
        working: false,
        dialogue: null,
        search: null,
        hidingZone: null,
        flags: ["awake", "commute", "printer-intro", "first-manager"],
        nextEventAt: 2000,
        nextCodingAt: 2000,
      },
      screen: "playing",
      revision: s.revision + 1,
    });
    changeSceneDebug({ freezeNpcs: true, overview: false });
  }, position);
  await page.waitForTimeout(1600);
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .filter((url) => new URL(url).pathname === "/src/game/runtime.ts")
      .at(-1)!;
    const { runtime } = await import(/* @vite-ignore */ path);
    return {
      player: [...runtime.player],
      height: runtime.playerHeight,
      speed: runtime.speed,
      camera: JSON.parse(JSON.stringify(runtime.camera)),
      npcs: runtime.npcs.size,
    };
  });
}
async function look(page: Page, yaw: number, pitch: number, zoom: number) {
  await page.evaluate(
    async ({ yaw, pitch, zoom }) => {
      const path = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((url) => new URL(url).pathname === "/src/game/input.ts")
        .at(-1)!;
      const { input } = await import(/* @vite-ignore */ path);
      Object.assign(input, { yaw, pitch, zoom });
    },
    { yaw, pitch, zoom },
  );
}

test("padded camera adapts to every room, wall, corner and zoom", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await prepare(page);
  const positions: [number, number][] = [
    [-6, 3.4],
    [3, 5.8],
    [3, -6.3],
    [6.8, -2.8],
    [-4, -6.9],
    [-12.5, -6.8],
    [9.5, 3.4],
    [-14.5, -3],
    [0, -9.5],
    [-14.5, -9.5],
  ];
  for (const [index, position] of positions.entries()) {
    await teleport(page, position);
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      await look(page, yaw, 0.3, index % 2 ? 2.6 : 8.5);
      await page.waitForTimeout(750);
      const s = await snapshot(page);
      expect(
        s.camera.blocked,
        `sphere collision in room ${index}, yaw ${yaw}`,
      ).toBe(false);
      expect(s.camera.position.every(Number.isFinite)).toBe(true);
      const distance = Math.hypot(
        ...s.camera.position.map(
          (n: number, i: number) => n - s.camera.target[i],
        ),
      );
      expect(
        distance,
        `avatar clearance in room ${index}, yaw ${yaw}`,
      ).toBeGreaterThan(0.65);
    }
    if (index === 1 || index === 9)
      await page.screenshot({
        path: info.outputPath(`camera-room-${index}.png`),
      });
  }
  expect(errors).toEqual([]);
});

test("movement accelerates, runs, turns, slides, uses steps and supports mouse look", async ({
  page,
}, info) => {
  await prepare(page, [0, 6]);
  const start = await snapshot(page);
  await page.keyboard.down("w");
  await page.waitForTimeout(450);
  const walking = await snapshot(page);
  expect(walking.player[1]).toBeLessThan(start.player[1] - 0.7);
  expect(walking.speed).toBeGreaterThan(2);
  await page.keyboard.down("Shift");
  await page.waitForTimeout(450);
  const running = await snapshot(page);
  // Compare actual distance over equal windows; a single contact-resolution tick
  // can have zero displacement even while the controller is running smoothly.
  const walkingDistance = Math.hypot(
    walking.player[0] - start.player[0],
    walking.player[1] - start.player[1],
  );
  const runningDistance = Math.hypot(
    running.player[0] - walking.player[0],
    running.player[1] - walking.player[1],
  );
  expect(runningDistance).toBeGreaterThan(walkingDistance * 1.15);
  await page.mouse.move(700, 450);
  await page.mouse.down();
  await page.mouse.move(940, 470, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect((await snapshot(page)).camera.blocked).toBe(false);
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
  await page.waitForTimeout(300);
  expect((await snapshot(page)).speed).toBeLessThan(0.08);
  await teleport(page, [-4, 1]);
  await look(page, Math.PI / 2, 0.5, 6);
  await page.waitForTimeout(700);
  const before = await snapshot(page);
  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  await page.waitForTimeout(250);
  const turned = await snapshot(page);
  expect(turned.player[0]).toBeLessThan(before.player[0] - 0.3);
  await teleport(page, [-13.2, -6.5]);
  await page.keyboard.down("s");
  await page.waitForTimeout(390);
  await page.keyboard.up("s");
  await page.waitForTimeout(180);
  expect((await snapshot(page)).height).toBeGreaterThan(0.9);
  await teleport(page, [-7.85, 1]);
  await page.keyboard.down("w");
  await page.keyboard.down("d");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  await page.keyboard.up("d");
  await page.waitForTimeout(300);
  expect((await snapshot(page)).camera.blocked).toBe(false);
  await page.screenshot({ path: info.outputPath("developer-movement.png") });
});

test("expanded cast, appearance controls, overview and rendering budget", async ({
  page,
}, info) => {
  await prepare(page);
  expect((await snapshot(page)).npcs).toBe(12);
  await page.keyboard.press("F2");
  await page.getByLabel("Office overview", { exact: true }).check();
  await page.getByRole("button", { name: "Close development tools" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: info.outputPath("expanded-office.png") });
  const scene = await snapshot(page);
  expect(scene.camera.drawCalls).toBeLessThan(350);
  expect(scene.camera.triangles).toBeLessThan(100000);
  await page.keyboard.press("F2");
  await page.getByRole("button", { name: /Spawn ambient NPC/ }).click();
  await expect.poll(async () => (await snapshot(page)).npcs).toBe(13);
  await page
    .getByRole("combobox", { name: "NPC appearance" })
    .selectOption("rockstar-developer");
  await expect(
    page.getByRole("button", { name: "Reroll procedural NPC" }),
  ).toBeDisabled();
  await page.getByRole("combobox", { name: "Hair style" }).selectOption("afro");
  await page.getByRole("button", { name: "Restore visual identity" }).click();
  await expect(page.getByRole("combobox", { name: "Hair style" })).toHaveValue(
    "long",
  );
});
