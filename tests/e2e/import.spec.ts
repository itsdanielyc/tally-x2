import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { launchLedger, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

test("native file selection imports through preview, IPC and the durable ledger", async () => {
  const directory = await temporaryDirectory();
  const source = join(directory, "bank.csv");
  await writeFile(source, 'Date,Payee,Amount,Note\r\n2026-01-01,Native CSV,-12.34,"line1\r\nline2"');
  const shell = await launchLedger(directory, { TALLY_IMPORT_PATH: source });
  try {
    await expect(shell.page.getByRole("button", { name: "Import CSV", exact: true })).toBeVisible({ timeout: 1500 });
    await shell.page.getByRole("button", { name: "Import CSV", exact: true }).click();
    await shell.page.getByRole("button", { name: "Choose CSV", exact: true }).click();
    await shell.page.getByRole("button", { name: "Preview import", exact: true }).click();
    await expect(shell.page.getByTestId("import-counts")).toContainText("1 accepted");
    await shell.page.getByRole("button", { name: "Confirm import", exact: true }).click();
    await expect(shell.page.getByRole("status")).toContainText("Imported 1 transaction");
    expect(JSON.parse(await readFile(join(directory, "ledger.json"), "utf8")).transactions[0]).toMatchObject({ payee: "Native CSV", amount: -1234, note: "line1\r\nline2" });
    await shell.page.getByRole("button", { name: "Transactions", exact: true }).click();
    await shell.page.getByRole("button", { name: "Edit Native CSV", exact: true }).click();
    await shell.page.getByLabel("Amount", { exact: true }).fill("-9.99");
    await shell.page.getByRole("button", { name: "Save transaction", exact: true }).click();
    await expect(shell.page.getByRole("status")).toContainText("Transaction saved");
    expect(JSON.parse(await readFile(join(directory, "ledger.json"), "utf8")).transactions[0]).toMatchObject({ amount: -999, note: "line1\r\nline2" });
  } finally { await shell.app.close(); await removeTemporaryDirectory(directory); }
});
