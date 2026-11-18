import { _electron, expect } from "@playwright/test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";

const executable = process.argv[2];
if (!executable) throw new Error("Usage: node scripts/installed-smoke.mjs <installed-executable> [args...]");
const artifacts = resolve("artifacts/l7");
await mkdir(artifacts, { recursive: true });
const directory = await mkdtemp(join(artifacts, `${process.platform}-`));
const cleanupTarget = resolve(directory);
if (!cleanupTarget.startsWith(artifacts + sep)) throw new Error("Refusing cleanup outside L7 artifacts");
const ledgerFile = join(directory, "ledger.json");
const fixture = JSON.parse(await readFile("tests/fixtures/install-ledger.json", "utf8"));
await writeFile(ledgerFile, JSON.stringify(fixture), { mode: 0o600 });
let application;

/** Drive installed code against a saved ledger, then restart after a durable write. */
async function exercise() {
  const RESTART_PASSES = 2;
  for (let pass = 0; pass < RESTART_PASSES; pass++) {
    application = await _electron.launch({ executablePath: executable, args: process.argv.slice(3), env: { ...process.env, TALLY_DATA_DIR: directory } });
    const page = await application.firstWindow();
    expect(await application.evaluate(({ app }) => app.isPackaged)).toBe(true);
    await expect(page.getByTestId("backend-badge")).toHaveText("native");
    await expect(page.getByRole("row").filter({ hasText: "Installer record" })).toContainText("GBP -1.23");
    if (pass === 0) {
      await page.getByLabel("Date", { exact: true }).fill("2026-01-16");
      await page.getByLabel("Payee", { exact: true }).fill("Installed write proof");
      await page.getByLabel("Amount", { exact: true }).fill("0.01");
      await page.getByRole("button", { name: "Save transaction", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Transaction saved");
    }
    await expect(page.getByRole("row").filter({ hasText: "Installed write proof" })).toContainText("GBP 0.01");
    const saved = JSON.parse(await readFile(ledgerFile, "utf8"));
    expect(saved.transactions.find((item) => item.id === "installer-fixture")).toEqual(fixture.transactions[0]);
    const name = basename(executable).replace(/[^a-z0-9.-]/gi, "_");
    await page.screenshot({ path: join(artifacts, `${process.platform}-${process.arch}-${name}.png`), fullPage: true });
    await application.close();
    application = undefined;
  }
}

try {
  await exercise();
  console.log("Installed app preserved a saved record and reopened a newly saved transaction");
} finally {
  await application?.close();
  await rm(cleanupTarget, { recursive: true, force: true });
}
