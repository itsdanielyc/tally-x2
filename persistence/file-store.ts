import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { emptyLedger, type Ledger } from "../contracts/ledger";
import { decodeLedger } from "../contracts/validation";
import type { LedgerStore } from "../backend/ports";

const PRIVATE_FILE_MODE = 0o600;
const PRIVATE_DIRECTORY_MODE = 0o700;

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
    const bytes = JSON.stringify(decodeLedger(ledger));
    const directory = dirname(this.file);
    await mkdir(directory, { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
    const temporaryFile = `${this.file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temporaryFile, "wx", PRIVATE_FILE_MODE);
      try { await handle.writeFile(bytes, "utf8"); await handle.sync(); }
      finally { await handle.close(); }
      await this.replaceFile(temporaryFile, this.file);
      await syncDirectory(directory);
    } finally {
      await rm(temporaryFile, { force: true });
    }
  }
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }

/** Persist the rename on POSIX; Windows does not support fsync on directories. */
async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === "win32") return;
  const handle = await open(directory, "r");
  try { await handle.sync(); }
  finally { await handle.close(); }
}
