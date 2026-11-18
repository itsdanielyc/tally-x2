import { afterEach, beforeEach, expect, it } from "vitest";
import { rename } from "node:fs/promises";
import { join } from "node:path";
import { LedgerService } from "../../backend/service";
import { emptyLedger, type LedgerCommand } from "../../contracts/ledger";
import { FileLedgerStore } from "../../persistence/file-store";
import { inspectCsv } from "../../domain/csv";
import { PURCHASE, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

let directory: string;
let failAfterReplacement = false;
beforeEach(async () => { directory = await temporaryDirectory(); failAfterReplacement = false; });
afterEach(async () => { await removeTemporaryDirectory(directory); });

async function serviceWithRecords(): Promise<LedgerService> {
  const store = new FileLedgerStore(join(directory, "ledger.json"), async (from, to) => {
    await rename(from, to);
    if (failAfterReplacement) throw new Error("injected error after replacement");
  });
  await store.save({ ...emptyLedger(), categories: ["Food", "Home"], transactions: [
    { ...PURCHASE, id: "a", payee: "A" }, { ...PURCHASE, id: "b", payee: "B" },
  ] });
  return new LedgerService(store);
}

it("a committed save error cannot leave an older undo that erases the new record", async () => {
  const service = await serviceWithRecords();
  await service.execute({ type: "transaction.delete", id: "a" });
  failAfterReplacement = true;
  await expect(service.execute({ type: "transaction.save", transaction: { ...PURCHASE, payee: "C" } })).rejects.toThrow("after replacement");
  failAfterReplacement = false;
  expect((await service.snapshot()).ledger.transactions.map((item) => item.payee)).toEqual(["C", "B"]);
  await expect(service.execute({ type: "undo" })).rejects.toThrow(/undo/i);
  expect((await service.snapshot()).ledger.transactions.map((item) => item.payee)).toEqual(["C", "B"]);
});

it.each(["delete", "merge", "import"] as const)("a committed %s error retains only the correct undo", async (kind) => {
  const service = await serviceWithRecords();
  const before = await service.snapshot();
  const content = "Date,Payee,Amount\n2026-01-01,C,-1.00";
  const command: LedgerCommand = kind === "delete" ? { type: "transaction.delete", id: "a" }
    : kind === "merge" ? { type: "category.merge", source: "Food", target: "Home" }
      : { type: "csv.import", file: { name: "bank.csv", content }, mapping: inspectCsv(content).mapping };
  failAfterReplacement = true;
  await expect(service.execute(command)).rejects.toThrow("after replacement");
  failAfterReplacement = false;
  expect((await service.snapshot()).canUndo).toBe(true);
  expect((await service.execute({ type: "undo" })).ledger).toEqual(before.ledger);
});

it("an undo that committed before an error is consumed exactly once", async () => {
  const service = await serviceWithRecords();
  const before = await service.snapshot();
  await service.execute({ type: "transaction.delete", id: "a" });
  failAfterReplacement = true;
  await expect(service.execute({ type: "undo" })).rejects.toThrow("after replacement");
  failAfterReplacement = false;
  expect((await service.snapshot()).ledger).toEqual(before.ledger);
  expect((await service.snapshot()).canUndo).toBe(false);
  await expect(service.execute({ type: "undo" })).rejects.toThrow(/undo/i);
});
