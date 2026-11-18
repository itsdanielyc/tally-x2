import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { launchLedger, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

test("native file selection imports through preview, IPC and the durable ledger", async () => {
  const directory = await temporaryDirectory();
  const source = join(directory, "bank.csv");
  await writeFile(source, "Date,Payee,Amount\n2026-01-01,Native CSV,-12.34");
  const shell = await launchLedger(directory, { TALLY_IMPORT_PATH: source });
  try {
    await expect(shell.page.getByRole("button", { name: "Import CSV", exact: true })).toBeVisible({ timeout: 1500 });
    await shell.page.getByRole("button", { name: "Import CSV", exact: true }).click();
    await shell.page.getByRole("button", { name: "Choose CSV", exact: true }).click();
    await shell.page.getByRole("button", { name: "Preview import", exact: true }).click();
    await expect(shell.page.getByTestId("import-counts")).toContainText("1 accepted");
    await shell.page.getByRole("button", { name: "Confirm import", exact: true }).click();
    await expect(shell.page.getByRole("status")).toContainText("Imported 1 transaction");
    expect(JSON.parse(await readFile(join(directory, "ledger.json"), "utf8")).transactions[0]).toMatchObject({ payee: "Native CSV", amount: -1234 });
  } finally { await shell.app.close(); await removeTemporaryDirectory(directory); }
});
