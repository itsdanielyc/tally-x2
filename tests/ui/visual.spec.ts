import { expect, test, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { assertGeometry, captureGeometry } from "./geometry";

const STATES = ["transactions", "categories", "summary", "import", "undo"] as const;
type VisualState = typeof STATES[number];

async function populate(page: Page): Promise<void> {
  await page.goto("/");
  for (const transaction of [{ payee: "Grocer", amount: "-12.34", category: "Food", note: "Weekly" }, { payee: "Employer", amount: "1000.00", category: "Income", note: "Salary" }]) {
    await page.getByLabel("Date", { exact: true }).fill("2026-01-15");
    await page.getByLabel("Payee", { exact: true }).fill(transaction.payee);
    await page.getByLabel("Amount", { exact: true }).fill(transaction.amount);
    await page.getByLabel("Category (optional)").fill(transaction.category);
    await page.getByLabel("Note (optional)").fill(transaction.note);
    await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  }
  await expect(page.getByTestId("shown-count")).toHaveText("2 shown · 2 total");
  await page.getByLabel("Date", { exact: true }).fill("2026-01-15");
  await page.getByLabel("Date", { exact: true }).blur();
}

async function prepare(page: Page, state: VisualState): Promise<void> {
  await populate(page);
  if (state === "transactions") {
    await page.getByText("Find transactions", { exact: true }).click();
    await page.getByLabel("Search payee or note", { exact: true }).fill("Weekly");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(page.getByTestId("shown-count")).toHaveText("1 shown · 2 total");
  } else if (state === "categories") {
    await page.getByRole("button", { name: "Categories", exact: true }).click();
    await page.getByLabel("Payee contains", { exact: true }).fill("grocer");
    await page.getByLabel("Rule category", { exact: true }).selectOption("Food");
    await page.getByRole("button", { name: "Save rule", exact: true }).click();
    await expect(page.getByRole("button", { name: "Delete rule grocer", exact: true })).toBeVisible();
  } else if (state === "summary") {
    await page.getByRole("button", { name: "Monthly summary", exact: true }).click();
    await page.getByLabel("Month", { exact: true }).fill("2026-01");
    await page.getByLabel("Budget for Food", { exact: true }).fill("10.00");
    await page.getByRole("button", { name: "Save budget Food", exact: true }).click();
    await expect(page.getByRole("row").filter({ hasText: "Food" })).toContainText("GBP 2.34 over");
  } else if (state === "import") {
    await page.getByRole("button", { name: "Import CSV", exact: true }).click();
    const csv = "Date;Payee;Debit;Credit\n31/01/2026;Coffee;2,50;\n31/02/2026;Invalid;1,00;";
    await page.locator('input[type="file"]').setInputFiles({ name: "visual.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await page.getByRole("button", { name: "Preview import", exact: true }).click();
    await expect(page.getByTestId("import-counts")).toHaveText("1 accepted · 0 duplicates skipped · 1 rejected");
  } else {
    await page.getByRole("button", { name: "Delete Grocer", exact: true }).click();
    await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeEnabled();
  }
  await page.locator("h1").click();
}

for (const state of STATES) {
  test(`tier 1: ${state} structure`, async ({ page }) => {
    await prepare(page, state);
    await expect(page.locator("main")).toMatchAriaSnapshot({ name: `${state}.aria.yml` });
  });
  test(`tier 2: ${state} geometry`, async ({ page }) => {
    await prepare(page, state);
    assertGeometry(join(test.info().project.testDir, "__snapshots__", "visual.spec.ts", `${state}.geometry.json`), await captureGeometry(page));
  });
  test(`tier 3: ${state} pixels`, async ({ page }, info) => {
    const name = `${state}-${info.project.name}-${process.platform}.png`;
    test.skip(!process.env.CI && !existsSync(join(info.project.testDir, "__snapshots__", "visual.spec.ts", name)), "Pixels come from the runner snapshots workflow");
    await prepare(page, state);
    await expect(page).toHaveScreenshot(name, { fullPage: true });
  });
}
