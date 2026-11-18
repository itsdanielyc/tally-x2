import { expect, test } from "@playwright/test";

test("combines filters, exports shown rows and undoes a deletion once", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Find transactions", { exact: true })).toBeVisible({ timeout: 1500 });
  for (const transaction of [{ payee: "Grocer", amount: "-12.34", category: "Food", note: "Weekly" }, { payee: "Hardware", amount: "-5.00", category: "Home", note: "Weekly repair" }]) {
    await page.getByLabel("Date", { exact: true }).fill("2026-01-15");
    await page.getByLabel("Payee", { exact: true }).fill(transaction.payee);
    await page.getByLabel("Amount", { exact: true }).fill(transaction.amount);
    await page.getByLabel("Category (optional)").fill(transaction.category);
    await page.getByLabel("Note (optional)").fill(transaction.note);
    await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  }
  await page.getByText("Find transactions", { exact: true }).click();
  await page.getByLabel("Search payee or note", { exact: true }).fill("weekly");
  await page.getByLabel("Filter category", { exact: true }).selectOption({ label: "Food" });
  await page.getByLabel("From date", { exact: true }).fill("2026-01-01");
  await page.getByLabel("To date", { exact: true }).fill("2026-01-31");
  await page.getByLabel("Minimum amount", { exact: true }).fill("-12.34");
  await page.getByLabel("Maximum amount", { exact: true }).fill("-12.34");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByTestId("shown-count")).toHaveText("1 shown · 2 total");
  await page.getByRole("button", { name: "Export shown", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Exported 1 transaction");
  await page.getByRole("button", { name: "Delete Grocer", exact: true }).click();
  await expect(page.getByTestId("shown-count")).toHaveText("0 shown · 1 total");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByTestId("shown-count")).toHaveText("1 shown · 2 total");
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await page.screenshot({ path: "artifacts/ui/find.png", fullPage: true });
});
