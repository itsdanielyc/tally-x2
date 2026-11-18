// The seam between the UI and the backend. Inside Electron the calls go
// through the preload bridge (window.electronBridge) over IPC to the main
// process; in a plain browser (Vite dev server, Playwright, a web build) a
// labelled mock answers instead. The mock is held to the same contract as the
// main process by tests/unit/contract.test.ts and by the real-shell suite, so
// a UI test that passes against the mock means something.
import type { ElectronBridge, PlatformInfo } from "../electron/bridge";
import type { LedgerApi } from "../contracts/ledger";
import { LedgerService } from "../backend/service";
import { memoryStore } from "../backend/ports";
import type { CsvFile } from "../contracts/csv";
import type { ExportReceipt, TransactionFilter } from "../contracts/find";
import { createCsvExport } from "../domain/export";

export interface Backend extends LedgerApi {
  exportCsv(filter: TransactionFilter): Promise<ExportReceipt | null>;
  pickCsv(): Promise<CsvFile | null>;
  readonly kind: "native" | "mock";
  platformInfo(): Promise<PlatformInfo>;
}

declare global {
  interface Window {
    electronBridge?: ElectronBridge;
  }
}

const bridge = typeof window !== "undefined" ? window.electronBridge : undefined;

const mockLedger = new LedgerService(memoryStore());

export const mock: Backend = {
  exportCsv: async (filter) => {
    const snapshot = await mockLedger.snapshot();
    return { name: "tally.csv", count: createCsvExport(snapshot.ledger, filter).count };
  },
  pickCsv: async () => null,
  snapshot: () => mockLedger.snapshot(),
  execute: (command) => mockLedger.execute(command),
  kind: "mock",
  platformInfo: async () => ({
    os: "mock",
    arch: "mock",
    electron: "mock",
    packaged: false,
  }),
};

function unavailable<T>(): Promise<T> {
  return Promise.reject(new Error("Desktop ledger connection is unavailable. Restart Tally."));
}

const disconnected: Backend = { kind: "native", snapshot: unavailable, execute: unavailable, pickCsv: unavailable, exportCsv: unavailable, platformInfo: unavailable };
const desktopPage = typeof window !== "undefined" && window.location.protocol === "file:";

export const backend: Backend = bridge
  ? {
      kind: "native",
      exportCsv: (filter) => bridge.exportCsv(filter),
      pickCsv: () => bridge.pickCsv(),
      snapshot: () => bridge.snapshot(),
      execute: (command) => bridge.execute(command),
      platformInfo: () => bridge.platformInfo(),
    }
  : desktopPage ? disconnected : mock;
