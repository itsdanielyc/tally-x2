import { mkdir, open, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";

const PRIVATE_FILE_MODE = 0o600;
const PRIVATE_DIRECTORY_MODE = 0o700;

/** Replace one UTF-8 document only after its sibling temporary file is fsynced. */
export async function writeAtomically(file: string, content: string, replaceFile = rename): Promise<void> {
  const directory = dirname(file);
  await mkdir(directory, { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  const temporaryFile = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporaryFile, "wx", PRIVATE_FILE_MODE);
    try { await handle.writeFile(content, "utf8"); await handle.sync(); }
    finally { await handle.close(); }
    await replaceFile(temporaryFile, file);
    await syncDirectory(directory);
  } finally { await rm(temporaryFile, { force: true }); }
}

/** Persist the rename on POSIX; Windows does not support fsync on directories. */
async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === "win32") return;
  const handle = await open(directory, "r");
  try { await handle.sync(); }
  finally { await handle.close(); }
}
