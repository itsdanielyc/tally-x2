import { open, realpath } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { MAX_CSV_BYTES, type CsvFile } from "../contracts/csv";
import { validateFilter, type ExportReceipt, type TransactionFilter } from "../contracts/find";
import type { LedgerApi } from "../contracts/ledger";
import { createCsvExport } from "../domain/export";
import { writeAtomically } from "../persistence/atomic-file";

/** The injected dialog chooser is the only OS-dependent part of file selection. */
export async function pickCsvFile(choosePath: () => Promise<string | undefined>): Promise<CsvFile | null> {
  const path = await choosePath();
  if (!path) return null;
  const handle = await open(path, "r");
  try {
    if ((await handle.stat()).size > MAX_CSV_BYTES) throw new Error("CSV exceeds the 20 MiB limit");
    const bytes = await handle.readFile();
    if (bytes.byteLength > MAX_CSV_BYTES) throw new Error("CSV exceeds the 20 MiB limit");
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { name: basename(path), content };
  } finally { await handle.close(); }
}

/** Snapshot the shown query, then atomically save it without risking the ledger. */
export async function exportCsvFile(source: LedgerApi, options: TransactionFilter, choosePath: () => Promise<string | undefined>, ledgerFile: string,
  writeFile: (path: string, content: string) => Promise<void> = writeAtomically): Promise<ExportReceipt | null> {
  const filter = validateFilter(options);
  const snapshot = await source.snapshot();
  const path = await choosePath();
  if (!path) return null;
  await protectLedger(path, ledgerFile);
  const exported = createCsvExport(snapshot.ledger, filter);
  await writeFile(path, exported.content);
  return { name: basename(path), count: exported.count };
}

function normalizedPath(path: string): string {
  const absolute = resolve(path);
  return process.platform === "linux" ? absolute : absolute.toLowerCase();
}

/** Time O(depth), space O(depth): resolve directory aliases before a file exists. */
async function canonicalPath(path: string): Promise<string> {
  try { return await realpath(path); }
  catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      const absolute = resolve(path);
      const parent = dirname(absolute);
      if (parent === absolute) throw error;
      return join(await canonicalPath(parent), basename(absolute));
    }
    throw error;
  }
}

async function protectLedger(destination: string, ledgerFile: string): Promise<void> {
  if (normalizedPath(destination) === normalizedPath(ledgerFile)) throw new Error("Cannot export over the ledger file");
  const [destinationPath, ledgerPath] = await Promise.all([canonicalPath(destination), canonicalPath(ledgerFile)]);
  if (normalizedPath(destinationPath) === normalizedPath(ledgerPath)) throw new Error("Cannot export over the ledger file");
}
