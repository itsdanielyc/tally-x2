// The typed surface the preload exposes to the renderer as window.electronBridge.
// The renderer imports only these types; the preload and main implement them.
import type { LedgerCommand, LedgerView } from "../contracts/ledger";

export type PlatformInfo = {
  /** process.platform in the main process: win32 | darwin | linux */
  os: string;
  /** process.arch in the main process: x64 | arm64 */
  arch: string;
  /** process.versions.electron */
  electron: string;
  /** app.isPackaged: false when launched from the build output, true when installed */
  packaged: boolean;
};

export interface ElectronBridge {
  snapshot(): Promise<LedgerView>;
  execute(command: LedgerCommand): Promise<LedgerView>;
  greet(name: string): Promise<string>;
  platformInfo(): Promise<PlatformInfo>;
}

/** IPC channel names, shared by main and preload. */
export const channels = {
  snapshot: "ledger:snapshot",
  execute: "ledger:execute",
  greet: "app:greet",
  platformInfo: "app:platform-info",
} as const;
