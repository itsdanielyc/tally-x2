import { open } from "node:fs/promises";
import { basename } from "node:path";
import { MAX_CSV_BYTES, type CsvFile } from "../contracts/csv";

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
