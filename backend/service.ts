import type { Ledger, LedgerApi, LedgerCommand, LedgerView } from "../contracts/ledger";
import { decodeLedger, validateCommand } from "../contracts/validation";
import { applyTransactionCommand } from "../domain/transactions";
import { importCsv } from "../domain/csv";
import type { LedgerStore } from "./ports";

/** One queue owns state, ensuring a save failure never publishes a partial change. */
export class LedgerService implements LedgerApi {
  private current: Ledger | undefined;
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly store: LedgerStore, private readonly createId: () => string = () => crypto.randomUUID()) {}

  /** A snapshot waits behind pending writes and cannot mutate internal state. */
  snapshot(): Promise<LedgerView> {
    return this.enqueue(async () => this.view(await this.load()));
  }

  /** Validate, derive, persist, then publish one whole command. */
  execute(payload: LedgerCommand): Promise<LedgerView> {
    return this.enqueue(async () => {
      const command = validateCommand(payload);
      const previous = await this.load();
      const candidate = command.type === "csv.import" ? importCsv(previous, command, this.createId)
        : applyTransactionCommand(previous, command, this.createId);
      if (!candidate) throw new Error("Unknown ledger command");
      if (candidate === previous) return this.view(previous);
      const next = decodeLedger(candidate);
      try {
        await this.store.save(next);
      } catch (error) {
        // A post-rename I/O error may have committed; reload before the next call.
        this.current = undefined;
        throw error;
      }
      this.current = next;
      return this.view(next);
    });
  }

  private async load(): Promise<Ledger> {
    this.current ??= decodeLedger(await this.store.load());
    return this.current;
  }

  private view(ledger: Ledger): LedgerView {
    return { ledger: structuredClone(ledger), canUndo: false };
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }
}
