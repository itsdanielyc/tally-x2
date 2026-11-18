import { expect, test } from "@playwright/test";

test("previews mapped bank rows with diagnostics, confirms and skips a repeat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Import CSV", exact: true })).toBeVisible({ timeout: 1500 });
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const content = "Bank export\nDate;Description;Debit;Credit\n31/01/2026;Grocer;12,34;\n31/02/2026;Invalid;1,00;\n31/01/2026;Grocer;12,34;";
  await page.locator('input[type="file"]').setInputFiles({ name: "bank.csv", mimeType: "text/csv", buffer: Buffer.from(content) });
  await page.getByLabel("Decimal separator", { exact: true }).selectOption(",");
  await page.getByRole("button", { name: "Preview import", exact: true }).click();
  await expect(page.getByTestId("import-counts")).toHaveText("1 accepted · 1 duplicates skipped · 1 rejected");
  await expect(page.getByRole("list", { name: "Rejected rows" }).getByText(/Line 4:/)).toContainText("calendar date");
  await page.screenshot({ path: "artifacts/ui/import.png", fullPage: true });
  await page.getByRole("button", { name: "Confirm import", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Imported 1 transaction");
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Grocer" })).toContainText("GBP -12.34");
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "bank.csv", mimeType: "text/csv", buffer: Buffer.from(content) });
  await page.getByRole("button", { name: "Preview import", exact: true }).click();
  await expect(page.getByTestId("import-counts")).toHaveText("0 accepted · 2 duplicates skipped · 1 rejected");
  await expect(page.getByRole("button", { name: "Confirm import", exact: true })).toBeDisabled();
});

test("the person can correct an ambiguous detected header without editing the CSV", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const csv = "Description,Debit,Credit\nDate,Payee,Amount\n2026-01-01,Kept,-1.00";
  await page.locator('input[type="file"]').setInputFiles({ name: "ambiguous.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.getByLabel("Header line", { exact: true })).toBeVisible({ timeout: 1500 });
  await page.getByLabel("Header line", { exact: true }).selectOption("1");
  await page.getByRole("button", { name: "Preview import", exact: true }).click();
  await expect(page.getByTestId("import-counts")).toHaveText("1 accepted · 0 duplicates skipped · 0 rejected");
});
