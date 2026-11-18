import type { LedgerCommand, LedgerView } from "../../contracts/ledger";

/** Views publish commands through the workspace; no view owns durable state. */
export interface ViewContext {
  view: LedgerView;
  perform(command: LedgerCommand, message: string): Promise<void>;
  showError(error: unknown): void;
}
