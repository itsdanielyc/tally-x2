// L6: the real shell. Playwright launches the built app (out/, from
// `npm run build`) with Electron itself and drives its first window.
// Everything here crosses the preload bridge and IPC to the main process,
// which no browser-mode test can do.
import { expect, test, type ElectronApplication, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { emptyLedger } from "../../contracts/ledger";
import { launchLedger, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

let app: ElectronApplication;
let win: Page;
const consoleErrors: string[] = [];
let directory: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  directory = await temporaryDirectory();
  const shell = await launchLedger(directory);
  app = shell.app;
  win = shell.page;
  win.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  await win.waitForLoadState("domcontentloaded");
});

test.afterAll(async () => {
  await app?.close();
  await removeTemporaryDirectory(directory);
});

test.describe("tally in the real shell", () => {
  test("renders the main window with the native backend", async () => {
    // The title comes from index.html, so a renamed app is checked against its
    // own page, never a hard-coded string.
    const html = readFileSync("index.html", "utf8");
    const title = /<title>(.*?)<\/title>/.exec(html)?.[1];
    expect(title).toBeTruthy();
    await expect(win).toHaveTitle(title!);
    await expect(win.locator("h1")).toHaveText("Tally");
    await expect(win.getByLabel("Payee", { exact: true })).toBeVisible();
    // The badge proves the UI is talking to the main process, not the mock.
    await expect(win.getByTestId("backend-badge")).toHaveText("native");
    // contextIsolation and the sandbox: the page sees the bridge, not Node.
    const exposed = await win.evaluate(() => ({
      bridge: typeof window.electronBridge,
      require: typeof (window as unknown as { require?: unknown }).require,
      process: typeof (window as unknown as { process?: unknown }).process,
    }));
    expect(exposed).toEqual({ bridge: "object", require: "undefined", process: "undefined" });
  });

  test("round-trips a call to the main process and matches the shared contract", async () => {
    const snapshot = await win.evaluate(() => window.electronBridge!.snapshot());
    expect(snapshot).toEqual({ ledger: emptyLedger(), canUndo: false });
  });

  test("reports the platform from the main process and saves a screenshot named after it", async () => {
    // Ask the main process directly, then the same question through the bridge.
    const main = await app.evaluate(({ app: electronApp }) => ({
      os: process.platform,
      arch: process.arch,
      packaged: electronApp.isPackaged,
    }));
    expect(["win32", "darwin", "linux"]).toContain(main.os);
    expect(["x64", "arm64"]).toContain(main.arch);
    expect(main.arch).toBe(process.platform === "darwin" ? "arm64" : "x64");
    expect(main.packaged).toBe(false);

    const viaBridge = await win.evaluate(() => window.electronBridge!.platformInfo());
    expect(viaBridge).toMatchObject(main);
    await expect(win.getByTestId("platform")).toHaveText(`${main.os} / ${main.arch}`);

    const dir = join(process.cwd(), "artifacts", "e2e");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${main.os}-${main.arch}.png`);
    await win.screenshot({ path: file });
    console.log(`[e2e] screenshot saved: ${file}`);
  });

  test("logged no console errors (CSP violations, failed loads)", async () => {
    expect(consoleErrors).toEqual([]);
  });
});
