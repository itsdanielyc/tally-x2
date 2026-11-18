// The seam between the UI and the backend. Inside Electron the calls go
// through the preload bridge (window.electronBridge) over IPC to the main
// process; in a plain browser (Vite dev server, Playwright, a web build) a
// labelled mock answers instead. The mock is held to the same contract as the
// main process by tests/unit/contract.test.ts and by the real-shell suite, so
// a UI test that passes against the mock means something.
import type { ElectronBridge, PlatformInfo } from "../electron/bridge";
import { greeting } from "../contracts/greet";
import type { LedgerApi } from "../contracts/ledger";
import { LedgerService } from "../backend/service";
import { memoryStore } from "../backend/ports";
import type { CsvFile } from "../contracts/csv";
import type { ExportReceipt, TransactionFilter } from "../contracts/find";

export interface Backend extends LedgerApi {
  exportCsv(filter: TransactionFilter): Promise<ExportReceipt | null>;
  pickCsv(): Promise<CsvFile | null>;
  readonly kind: "native" | "mock";
  greet(name: string): Promise<string>;
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
  exportCsv: async () => ({ name: "tally.csv", count: 0 }),
  pickCsv: async () => null,
  snapshot: () => mockLedger.snapshot(),
  execute: (command) => mockLedger.execute(command),
  kind: "mock",
  greet: async (name) => greeting(name),
  platformInfo: async () => ({
    os: "mock",
    arch: "mock",
    electron: "mock",
    packaged: false,
  }),
};

export const backend: Backend = bridge
  ? {
      kind: "native",
      exportCsv: (filter) => bridge.exportCsv(filter),
      pickCsv: () => bridge.pickCsv(),
      snapshot: () => bridge.snapshot(),
      execute: (command) => bridge.execute(command),
      greet: (name) => bridge.greet(name),
      platformInfo: () => bridge.platformInfo(),
    }
  : mock;
