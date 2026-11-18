import { readFile, rename } from "node:fs/promises";
import { emptyLedger, type Ledger } from "../contracts/ledger";
import { decodeLedger } from "../contracts/validation";
import type { LedgerStore } from "../backend/ports";
import { writeAtomically } from "./atomic-file";

/** Versioned local file with a same-directory, fsynced atomic replacement. */
export class FileLedgerStore implements LedgerStore {
  constructor(private readonly file: string, private readonly replaceFile = rename) {}

  /** Missing is new; invalid data is an error and is never silently reset. */
  async load(): Promise<Ledger> {
    try {
      return decodeLedger(JSON.parse(await readFile(this.file, "utf8")) as unknown);
    } catch (error) {
      if (hasCode(error, "ENOENT")) return emptyLedger();
      throw new Error(`Unable to open ledger ${this.file}: ${errorMessage(error)}`, { cause: error });
    }
  }

  /** The old file remains intact until the single atomic rename commits. */
  async save(ledger: Ledger): Promise<void> {
    await writeAtomically(this.file, JSON.stringify(decodeLedger(ledger)), this.replaceFile);
  }
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }

