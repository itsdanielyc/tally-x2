import { _electron, expect, type ElectronApplication, type Page } from "@playwright/test";
import { temporaryDirectory, removeTemporaryDirectory } from "../unit/helpers";

/** Each shell test owns a ledger under this repository, never the user's ledger. */
export async function launchLedger(directory: string, environment: Record<string, string> = {}): Promise<{ app: ElectronApplication; page: Page; consoleErrors: string[] }> {
  const app = await _electron.launch({ args: ["."], cwd: process.cwd(), env: { ...process.env, TALLY_DATA_DIR: directory, ...environment } });
  const page = await app.firstWindow();
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await expect(page.getByTestId("backend-badge")).toHaveText("native");
  return { app, page, consoleErrors };
}

export { temporaryDirectory, removeTemporaryDirectory };
