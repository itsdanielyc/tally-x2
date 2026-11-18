import { emptyLedger, type Ledger } from "../contracts/ledger";

/** Storage is the only I/O dependency required by the ledger command service. */
export interface LedgerStore {
  load(): Promise<Ledger>;
  save(ledger: Ledger): Promise<void>;
}

/** The browser test surface uses isolated memory, never localStorage. */
export function memoryStore(initial = emptyLedger()): LedgerStore {
  let ledger = structuredClone(initial);
  return { load: async () => structuredClone(ledger), save: async (next) => { ledger = structuredClone(next); } };
}
