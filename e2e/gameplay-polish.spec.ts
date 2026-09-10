import { test, expect } from "@playwright/test";

test("bathroom evasion, development controls, coding feedback and persistent achievements", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await page.getByRole("button", { name: /Get up/ }).waitFor();
  await page.waitForTimeout(2500);
  // Arrange a pursuit; actual collision, visibility, hide control, clock and expiry remain live.
  await page.evaluate(async () => {
    const source = (path: string) =>
      performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((url) => new URL(url).pathname === path)
        .at(-1)!;
    const { useGame } = await import(
      /* @vite-ignore */ source("/src/game/store.ts")
    );
    const { runtime } = await import(
      /* @vite-ignore */ source("/src/game/runtime.ts")
    );
    const { requestSearch } = await import(
      /* @vite-ignore */ source("/src/events/encounter-engine.ts")
    );
    const state = useGame.getState(),
      position = [3, 5.8];
    runtime.player = [...position];
    runtime.npcs.clear();
    const game = requestSearch(
      {
        ...state.game,
        awake: true,
        location: "office",
        position,
        flags: ["awake", "commute", "printer-intro", "first-manager"],
        nextEventAt: 2000,
      },
      "minute",
    );
    useGame.setState({
      game,
      revision: state.revision + 1,
      seeking: "minute",
      nearest: null,
    });
  });
  await page
    .getByRole("button", { name: "Lay low · 7 min", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Leave hiding spot/ }),
  ).toBeVisible();
  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  const hidden = await page.evaluate(async () => {
    const source = (path: string) =>
      performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((url) => new URL(url).pathname === path)
        .at(-1)!;
    const { runtime } = await import(
      /* @vite-ignore */ source("/src/game/runtime.ts")
    );
    return [...runtime.player];
  });
  expect(hidden[1]).toBeCloseTo(5.8, 1);
  await page.screenshot({ path: testInfo.outputPath("hiding.png") });
  const escaped = await page.evaluate(async () => {
    const path = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .filter((url) => new URL(url).pathname === "/src/game/store.ts")
      .at(-1)!;
    const { useGame } = await import(/* @vite-ignore */ path);
    useGame.getState().tick(80);
    await useGame.getState().save();
    return {
      achievements: useGame.getState().profile.achievements,
      hiddenMinutes: useGame.getState().game.stats.time.hiding,
      search: useGame.getState().game.search,
    };
  });
  expect(escaped.achievements).toContain("bathroom-escape");
  expect(escaped.hiddenMinutes).toBeCloseTo(7, 1);
  expect(escaped.search).toBeNull();
  await page.keyboard.press("F2");
  await page
    .getByRole("combobox", { name: "Teleport", exact: true })
    .selectOption("desk");
  await page.getByRole("button", { name: "Teleport", exact: true }).click();
  await page.getByRole("button", { name: "Close development tools" }).click();
  await page.getByRole("button", { name: /Sit down & code/ }).click();
  await page.keyboard.press("F2");
  await page
    .getByRole("combobox", { name: "Encounter", exact: true })
    .selectOption("auth-code");
  await page
    .getByRole("button", { name: "Trigger interruption / coding decision" })
    .click();
  await page.getByRole("button", { name: /Quick fix/ }).click();
  await page.keyboard.press("F2");
  await expect(page.getByText(/Unlocked: Works On My Machine/)).toBeVisible();
  await page.getByRole("button", { name: "Pause game" }).click();
  await page.getByRole("button", { name: /Day journal/ }).click();
  await expect(
    page.getByRole("dialog", { name: "The Monday dossier." }),
  ).toBeVisible();
  await expect(
    page.getByText("Bathroom Escape Artist", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("journal.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Save & main menu" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Journal & achievements/ }).click();
  await expect(page.locator(".journal-achievements .unlocked")).toHaveCount(2);
  expect(errors).toEqual([]);
});
