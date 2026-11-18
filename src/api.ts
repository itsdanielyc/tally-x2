// The seam between the UI and the backend. Inside Electron the calls go
// through the preload bridge (window.electronBridge) over IPC to the main
// process; in a plain browser (Vite dev server, Playwright, a web build) a
// labelled mock answers instead. The mock is held to the same contract as the
// main process by tests/unit/contract.test.ts and by the real-shell suite, so
// a UI test that passes against the mock means something.
import type { ElectronBridge, PlatformInfo } from "../electron/bridge";
import { greeting } from "../contracts/greet";
import { emptyLedger, type LedgerApi } from "../contracts/ledger";
import { decodeLedger, validateCommand } from "../contracts/validation";

export interface Backend extends LedgerApi {
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

export const mock: Backend = {
  snapshot: async () => ({ ledger: decodeLedger(emptyLedger()), canUndo: false }),
  execute: async (command) => { validateCommand(command); throw new Error("Ledger storage is not connected yet"); },
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
      snapshot: () => bridge.snapshot(),
      execute: (command) => bridge.execute(command),
      greet: (name) => bridge.greet(name),
      platformInfo: () => bridge.platformInfo(),
    }
  : mock;
