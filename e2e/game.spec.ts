import { test, expect } from "@playwright/test";

test("menu, controls and local save restore in an isolated browser", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New game", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue/ })).toBeDisabled();
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: testInfo.outputPath("menu.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Graphics quality").selectOption("medium");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page.getByRole("button", { name: /Get up/ })).toBeVisible();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: testInfo.outputPath("home.png") });
  await page.keyboard.press("e");
  await expect(page.getByText("GET TO WORK", { exact: true })).toBeVisible();
  await page.keyboard.down("s");
  await page.waitForTimeout(1200);
  await page.keyboard.up("s");
  await page.keyboard.down("d");
  await page.waitForTimeout(1550);
  await page.keyboard.up("d");
  await page.keyboard.down("s");
  await page.waitForTimeout(750);
  await page.keyboard.up("s");
  await page.screenshot({ path: testInfo.outputPath("home-door.png") });
  await page.getByRole("button", { name: /Leave for work/ }).click();
  await expect(
    page.getByText("WALK TO THE OFFICE", { exact: true }),
  ).toBeVisible();
  await page.keyboard.down("w");
  await page.waitForTimeout(2500);
  await page.keyboard.up("w");
  await expect(
    page.getByRole("dialog", { name: "Tech support, everywhere" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Sorry, I’m late/ }).click();
  await page.keyboard.down("w");
  await page.waitForTimeout(2600);
  await page.keyboard.up("w");
  await page.getByRole("button", { name: /Enter the office/ }).click();
  await expect(
    page.getByRole("dialog", { name: "A warm welcome" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /One with boundaries/ }).click();
  await page.keyboard.down("w");
  await page.waitForTimeout(1600);
  await page.keyboard.up("w");
  await expect(
    page.getByRole("dialog", { name: "PC LOAD LETTER" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Try the actual support team/ })
    .click();
  await page.keyboard.down("a");
  await page.waitForTimeout(2100);
  await page.keyboard.up("a");
  await page.keyboard.down("w");
  await page.waitForTimeout(650);
  await page.keyboard.up("w");
  await page.getByRole("button", { name: /Sit down & code/ }).click();
  await expect(page.getByText("actually-working.ts")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("office-working.png") });
  await page.waitForTimeout(4000);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /Save game/ }).click();
  await expect(
    page.getByRole("button", { name: /saved locally/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save & main menu" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: /Continue/ })).toBeEnabled();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("MONDAY, INC.", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile menu fits the viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New game", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: testInfo.outputPath("mobile-menu.png"),
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});
