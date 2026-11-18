import { expect, test } from "@playwright/test";

test("shows exact monthly totals, over-budget amount and month-specific navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Monthly summary", exact: true })).toBeVisible({ timeout: 1500 });
  for (const transaction of [{ payee: "Grocer", amount: "-12.34", category: "Food" }, { payee: "Employer", amount: "1000.00", category: "Salary" }]) {
    await page.getByLabel("Date", { exact: true }).fill("2026-01-15");
    await page.getByLabel("Payee", { exact: true }).fill(transaction.payee);
    await page.getByLabel("Amount", { exact: true }).fill(transaction.amount);
    await page.getByLabel("Category (optional)").fill(transaction.category);
    await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  }
  await page.getByRole("button", { name: "Monthly summary", exact: true }).click();
  await page.getByLabel("Month", { exact: true }).fill("2026-01");
  await expect(page.getByTestId("summary-income")).toHaveText("GBP 1000.00");
  await expect(page.getByTestId("summary-spending")).toHaveText("GBP 12.34");
  await expect(page.getByTestId("summary-net")).toHaveText("GBP 987.66");
  await page.getByLabel("Budget for Food", { exact: true }).fill("10.00");
  await page.getByRole("button", { name: "Save budget Food", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Food" })).toContainText("GBP 2.34 over");
  await page.screenshot({ path: "artifacts/ui/summary.png", fullPage: true });
  await page.getByRole("button", { name: "Previous month", exact: true }).click();
  await expect(page.getByLabel("Month", { exact: true })).toHaveValue("2025-12");
  await expect(page.getByTestId("summary-spending")).toHaveText("GBP 0.00");
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Food" })).toContainText("GBP 2.34 over");
});
