import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { launchLedger, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

test("native filtered export imports into an empty ledger unchanged", async () => {
  const originalDirectory = await temporaryDirectory();
  const restoredDirectory = await temporaryDirectory();
  const exportedFile = join(originalDirectory, "tally.csv");
  let shell = await launchLedger(originalDirectory, { TALLY_EXPORT_PATH: exportedFile });
  try {
    await expect(shell.page.getByText("Find transactions", { exact: true })).toBeVisible({ timeout: 1500 });
    await shell.page.getByLabel("Date", { exact: true }).fill("2026-01-15");
    await shell.page.getByLabel("Payee", { exact: true }).fill("Export proof");
    await shell.page.getByLabel("Amount", { exact: true }).fill("-12.34");
    await shell.page.getByLabel("Category (optional)").fill("Food");
    await shell.page.getByLabel("Note (optional)").fill("Round trip");
    await shell.page.getByRole("button", { name: "Save transaction", exact: true }).click();
    await expect(shell.page.getByRole("status")).toContainText("Transaction saved");
    const original = JSON.parse(await readFile(join(originalDirectory, "ledger.json"), "utf8"));
    await shell.page.getByText("Find transactions", { exact: true }).click();
    await shell.page.getByLabel("Search payee or note", { exact: true }).fill("Export");
    await shell.page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await shell.page.getByRole("button", { name: "Export shown", exact: true }).click();
    await expect(shell.page.getByRole("status")).toContainText("Exported 1 transaction");
    await shell.app.close();
    shell = await launchLedger(restoredDirectory, { TALLY_IMPORT_PATH: exportedFile });
    await shell.page.getByRole("button", { name: "Import CSV", exact: true }).click();
    await shell.page.getByRole("button", { name: "Choose CSV", exact: true }).click();
    await shell.page.getByRole("button", { name: "Preview import", exact: true }).click();
    await shell.page.getByRole("button", { name: "Confirm import", exact: true }).click();
    await expect(shell.page.getByRole("status")).toContainText("Imported 1 transaction");
    expect(JSON.parse(await readFile(join(restoredDirectory, "ledger.json"), "utf8")).transactions).toEqual(original.transactions);
  } finally { await shell.app.close(); await removeTemporaryDirectory(originalDirectory); await removeTemporaryDirectory(restoredDirectory); }
});
