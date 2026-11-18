import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { TransactionDraft } from "../../contracts/ledger";

export const PURCHASE: TransactionDraft = { date: "2026-01-15", payee: "Grocer", amount: -1234, category: "Food", note: "Weekly" };

export async function temporaryDirectory(): Promise<string> {
  const root = resolve("artifacts");
  await mkdir(root, { recursive: true });
  return mkdtemp(join(root, "ledger-test-"));
}

export async function removeTemporaryDirectory(directory: string): Promise<void> {
  const target = resolve(directory);
  if (!target.startsWith(resolve("artifacts") + sep)) throw new Error("Refusing cleanup outside artifacts");
  await rm(target, { recursive: true, force: true });
}
