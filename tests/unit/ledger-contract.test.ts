import { expect, it } from "vitest";
import { join } from "node:path";
import { LedgerService } from "../../backend/service";
import { FileLedgerStore } from "../../persistence/file-store";
import { mock } from "../../src/api";
import type { LedgerApi } from "../../contracts/ledger";
import { PURCHASE, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

async function exercise(api: LedgerApi) {
  expect((await api.snapshot()).ledger.transactions).toEqual([]);
  const saved = await api.execute({ type: "transaction.save", transaction: PURCHASE });
  const id = saved.ledger.transactions[0].id;
  const edited = await api.execute({ type: "transaction.save", id, transaction: { ...PURCHASE, note: "Edited" } });
  await expect(api.execute({ type: "transaction.save", transaction: { ...PURCHASE, amount: 1.1 } })).rejects.toThrow(/integer/);
  await api.execute({ type: "transaction.delete", id });
  return edited.ledger.transactions.map((item) => ({ date: item.date, payee: item.payee, amount: item.amount, category: item.category, note: item.note }));
}

it("the labelled mock and file-backed service answer the same contract calls", async () => {
  const directory = await temporaryDirectory();
  try {
    const real = new LedgerService(new FileLedgerStore(join(directory, "ledger.json")));
    expect(await exercise(mock)).toEqual(await exercise(real));
  } finally { await removeTemporaryDirectory(directory); }
});
