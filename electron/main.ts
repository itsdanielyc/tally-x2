import { app, BrowserWindow, dialog, ipcMain, session, type IpcMainInvokeEvent } from "electron";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { channels, type PlatformInfo } from "./bridge";
import { LedgerService } from "../backend/service";
import { FileLedgerStore } from "../persistence/file-store";
import { validateCommand } from "../contracts/validation";
import { pickCsvFile } from "./files";
import { validateFilter } from "../contracts/find";

let primaryWindow: BrowserWindow | undefined;
const dataDirectory = process.env.TALLY_DATA_DIR;
if (dataDirectory) { mkdirSync(resolve(dataDirectory), { recursive: true }); app.setPath("userData", resolve(dataDirectory)); }

/** Only our sandboxed window may invoke the application command surface. */
function assertSender(event: IpcMainInvokeEvent): void {
  if (event.sender !== primaryWindow?.webContents || event.senderFrame !== event.sender.mainFrame) throw new Error("Untrusted IPC sender");
}

function platformInfo(): PlatformInfo {
  return { os: process.platform, arch: process.arch, electron: process.versions.electron, packaged: app.isPackaged };
}

/** The desktop app is offline; only the local development server is exempt. */
function configureSession(): void {
  const developmentUrl = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL : undefined;
  session.defaultSession.webRequest.onBeforeRequest((request, callback) => {
    const localDevelopment = developmentUrl && new URL(request.url).origin === new URL(developmentUrl).origin;
    callback({ cancel: !request.url.startsWith("file:") && !localDevelopment });
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.on("will-download", (event) => event.preventDefault());
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1100, height: 780, minWidth: 760, minHeight: 600, title: "Tally", show: false,
    webPreferences: { preload: join(import.meta.dirname, "../preload/preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  primaryWindow = window;
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  const developmentUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && developmentUrl) void window.loadURL(developmentUrl);
  else void window.loadFile(join(import.meta.dirname, "../renderer/index.html"));
}

function start(): void {
  configureSession();
  const ledger = new LedgerService(new FileLedgerStore(join(app.getPath("userData"), "ledger.json")));
  ipcMain.handle(channels.exportCsv, (event, filter: unknown) => { assertSender(event); validateFilter(filter); return null; });
  ipcMain.handle(channels.pickCsv, (event) => {
    assertSender(event);
    return pickCsvFile(async () => {
      if (!app.isPackaged && process.env.TALLY_IMPORT_PATH) return process.env.TALLY_IMPORT_PATH;
      const selection = await dialog.showOpenDialog({ title: "Import a bank CSV", properties: ["openFile"], filters: [{ name: "CSV", extensions: ["csv", "txt"] }] });
      return selection.canceled ? undefined : selection.filePaths[0];
    });
  });
  ipcMain.handle(channels.snapshot, (event) => { assertSender(event); return ledger.snapshot(); });
  ipcMain.handle(channels.execute, (event, command: unknown) => { assertSender(event); return ledger.execute(validateCommand(command)); });
  ipcMain.handle(channels.platformInfo, (event) => { assertSender(event); return platformInfo(); });
  ipcMain.handle(channels.greet, (event, name: unknown) => {
    assertSender(event);
    return `Hello, ${String(name)}! You've been greeted from the main process!`;
  });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}

if (app.requestSingleInstanceLock()) {
  app.whenReady().then(start).catch((error: unknown) => { console.error(error); app.exit(1); });
} else app.quit();

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
