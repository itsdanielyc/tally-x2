import type { Ledger, LedgerApi, LedgerCommand, LedgerView } from "../contracts/ledger";
import { decodeLedger, validateCommand } from "../contracts/validation";
import { deriveLedger } from "./commands";
import type { LedgerStore } from "./ports";

const UNDOABLE_COMMANDS = new Set<LedgerCommand["type"]>(["transaction.delete", "category.delete", "category.merge", "csv.import"]);

/** One queue owns state, ensuring a save failure never publishes a partial change. */
export class LedgerService implements LedgerApi {
  private current: Ledger | undefined;
  private pending: Promise<void> = Promise.resolve();
  private undoState: Ledger | undefined;

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
      if (command.type === "undo") return this.undoLast();
      const candidate = deriveLedger(previous, command, this.createId);
      if (candidate === previous) return this.view(previous);
      const next = decodeLedger(candidate);
      await this.persist(next);
      this.undoState = UNDOABLE_COMMANDS.has(command.type) ? previous : undefined;
      return this.view(next);
    });
  }

  private async load(): Promise<Ledger> {
    this.current ??= decodeLedger(await this.store.load());
    return this.current;
  }

  private view(ledger: Ledger): LedgerView {
    return { ledger: structuredClone(ledger), canUndo: this.undoState !== undefined };
  }

  private async persist(ledger: Ledger): Promise<void> {
    try { await this.store.save(ledger); }
    catch (error) {
      // A post-rename I/O error may have committed; reload before the next call.
      this.current = undefined;
      throw error;
    }
    this.current = ledger;
  }

  private async undoLast(): Promise<LedgerView> {
    if (!this.undoState) throw new Error("No operation available to undo");
    const previous = this.undoState;
    await this.persist(previous);
    this.undoState = undefined;
    return this.view(previous);
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }
}
