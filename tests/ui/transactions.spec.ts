import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Transactions", exact: true })).toBeVisible({ timeout: 1500 });
});

test("records, orders, edits and deletes a transaction", async ({ page }) => {
  await page.getByLabel("Date", { exact: true }).fill("2026-01-15");
  await page.getByLabel("Payee", { exact: true }).fill("Grocer <safe>");
  await page.getByLabel("Amount", { exact: true }).fill("-12.34");
  await page.getByLabel("Category (optional)").fill("Food");
  await page.getByLabel("Note (optional)").fill("Weekly");
  await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Grocer <safe>" });
  await expect(row).toContainText("GBP -12.34");
  await page.getByRole("button", { name: "Edit Grocer <safe>", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("-9.99");
  await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  await expect(row).toContainText("GBP -9.99");
  await page.getByRole("button", { name: "Delete Grocer <safe>", exact: true }).click();
  await expect(page.getByText("No transactions yet", { exact: true })).toBeVisible();
});

test("rejects fractional cents and changes the single currency", async ({ page }) => {
  await page.getByLabel("Payee", { exact: true }).fill("Bad amount");
  await page.getByLabel("Amount", { exact: true }).fill("1.001");
  await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("two decimal places");
  await page.getByText("Settings", { exact: true }).click();
  await page.getByLabel("Currency", { exact: true }).selectOption("EUR");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toContainText("Currency saved");
});
