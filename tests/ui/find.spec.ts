import { expect, test } from "@playwright/test";
import type { Backend } from "../../src/api";
import type { LedgerCommand } from "../../contracts/ledger";

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

test("an error after a committed command refreshes the list and undo availability", async ({ page }) => {
  await page.goto("/");
  for (const payee of ["Record A", "Record B"]) {
    await page.getByLabel("Payee", { exact: true }).fill(payee);
    await page.getByLabel("Amount", { exact: true }).fill("-1.00");
    await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  }
  await page.getByRole("button", { name: "Delete Record A", exact: true }).click();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeEnabled();
  await page.evaluate(async () => {
    const specifier = "/src/api.ts";
    const module = await import(specifier);
    const backend = module.backend as Backend;
    const execute = backend.execute.bind(backend);
    backend.execute = async (command: LedgerCommand) => {
      const view = await execute(command);
      if (command.type === "transaction.save") throw new Error("Injected post-commit transport error");
      return view;
    };
  });
  await page.getByLabel("Payee", { exact: true }).fill("Committed C");
  await page.getByLabel("Amount", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Injected post-commit");
  await expect(page.getByRole("row").filter({ hasText: "Committed C" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
});
