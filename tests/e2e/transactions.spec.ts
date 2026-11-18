import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { launchLedger, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

test("a transaction survives a complete Electron restart unchanged", async () => {
  const directory = await temporaryDirectory();
  let shell = await launchLedger(directory);
  try {
    await expect(shell.page.getByRole("heading", { name: "Transactions", exact: true })).toBeVisible({ timeout: 1500 });
    await shell.page.getByLabel("Date", { exact: true }).fill("2024-02-29");
    await shell.page.getByLabel("Payee", { exact: true }).fill("Restart proof");
    await shell.page.getByLabel("Amount", { exact: true }).fill("-0.01");
    await shell.page.getByLabel("Note (optional)").fill("Keeps exact cents");
    await shell.page.getByRole("button", { name: "Save transaction", exact: true }).click();
    await expect(shell.page.getByRole("row").filter({ hasText: "Restart proof" })).toContainText("GBP -0.01");
    const bytes = await readFile(join(directory, "ledger.json"), "utf8");
    await shell.app.close();
    shell = await launchLedger(directory);
    await expect(shell.page.getByRole("row").filter({ hasText: "Restart proof" })).toContainText("Keeps exact cents");
    expect(await readFile(join(directory, "ledger.json"), "utf8")).toBe(bytes);
  } finally { await shell.app.close(); await removeTemporaryDirectory(directory); }
});
