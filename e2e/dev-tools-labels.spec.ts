import { test, expect } from "@playwright/test";

test("development sliders have one control per label and keep live readouts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await page.getByRole("button", { name: "Development tools" }).click();
  const panel = page.getByRole("complementary", {
    name: "Development playground",
  });
  await expect(panel).toBeVisible();

  const invalidLabels = await panel.locator("label").evaluateAll((labels) =>
    labels.flatMap((label) => {
      const controls = label.querySelectorAll(
        'button, input:not([type="hidden"]), meter, output, progress, select, textarea',
      );
      return controls.length > 1
        ? [
            {
              text: label.textContent?.trim(),
              controls: [...controls].map((control) => control.tagName),
            },
          ]
        : [];
    }),
  );
  expect(invalidLabels).toEqual([]);

  const names = [
    "stress",
    "energy",
    "technicalDebt",
    "codeQuality",
    "reputation",
    "Relationship",
  ];
  await expect(panel.locator("output")).toHaveCount(names.length);
  for (const [index, name] of names.entries()) {
    const slider = panel.getByRole("slider", { name, exact: true });
    await expect(slider).toHaveAccessibleName(name);
    const previous = Number(await slider.inputValue());
    await panel.getByText(name, { exact: true }).click();
    await expect(slider).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue(String(previous + 1));
    await expect(panel.locator("output").nth(index)).toHaveText(
      String(previous + 1),
    );
  }
});
