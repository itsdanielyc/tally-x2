import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { assertGeometry, captureGeometry } from "./geometry";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("backend-badge")).toHaveText("mock");
  await expect(page.getByLabel("Payee", { exact: true })).toBeVisible();
  await page.getByLabel("Date", { exact: true }).fill("2026-01-15");
  await page.getByLabel("Date", { exact: true }).blur();
  await expect(page.getByRole("status")).toContainText("All changes saved");
});

test("tier 1: accessibility structure is identical everywhere", async ({ page }) => {
  await expect(page.locator("main")).toMatchAriaSnapshot({ name: "home.aria.yml" });
});

test("tier 2: layout geometry stays within tolerance everywhere", async ({ page }) => {
  const actual = await captureGeometry(page);
  assertGeometry(join(test.info().project.testDir, "__snapshots__", "home.spec.ts", "home.geometry.json"), actual);
});

test("tier 3: pixels match the per-OS baseline", async ({ page }, testInfo) => {
  const name = `home-${testInfo.project.name}-${process.platform}.png`;
  const baseline = join(testInfo.project.testDir, "__snapshots__", "home.spec.ts", name);
  test.skip(!process.env.CI && !existsSync(baseline), "Runner baselines are captured by the snapshots workflow");
  await expect(page).toHaveScreenshot(name, { fullPage: true });
});
