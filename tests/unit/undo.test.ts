import { expect, it } from "vitest";
import { LedgerService } from "../../backend/service";
import { memoryStore } from "../../backend/ports";
import { emptyLedger } from "../../contracts/ledger";
import { inspectCsv } from "../../domain/csv";
import { PURCHASE } from "./helpers";

it("undoes a transaction delete exactly once and does not expose mutable snapshots", async () => {
  const service = new LedgerService(memoryStore());
  const saved = await service.execute({ type: "transaction.save", transaction: PURCHASE });
  const id = saved.ledger.transactions[0].id;
  const deleted = await service.execute({ type: "transaction.delete", id });
  expect(deleted.canUndo).toBe(true);
  expect((await service.execute({ type: "undo" })).ledger).toEqual(saved.ledger);
  await expect(service.execute({ type: "undo" })).rejects.toThrow(/undo/i);
  saved.ledger.transactions[0].payee = "external mutation";
  expect((await service.snapshot()).ledger.transactions[0].payee).toBe(PURCHASE.payee);
});

it("undoes category merge, category deletion and an entire import", async () => {
  const service = new LedgerService(memoryStore({ ...emptyLedger(), categories: ["Food", "Home"],
    transactions: [{ ...PURCHASE, id: "original" }], rules: [{ id: "r", contains: "grocer", category: "Food" }],
    budgets: [{ category: "Food", month: "2026-01", amount: 100 }] }));
  const before = await service.snapshot();
  await service.execute({ type: "category.merge", source: "Food", target: "Home" });
  expect((await service.execute({ type: "undo" })).ledger).toEqual(before.ledger);
  await service.execute({ type: "category.delete", name: "Food" });
  expect((await service.execute({ type: "undo" })).ledger).toEqual(before.ledger);
  const csv = "Date,Payee,Amount\n2026-01-01,New,-1.00\n2026-01-02,Other,-2.00";
  await service.execute({ type: "csv.import", file: { name: "bank.csv", content: csv }, mapping: inspectCsv(csv).mapping });
  expect((await service.execute({ type: "undo" })).ledger).toEqual(before.ledger);
});

it("a failed mutation preserves undo; a later successful mutation invalidates it", async () => {
  const storage = memoryStore();
  let failSave = false;
  const service = new LedgerService({ load: () => storage.load(), save: async (ledger) => {
    if (failSave) throw new Error("injected failure");
    await storage.save(ledger);
  } });
  const saved = await service.execute({ type: "transaction.save", transaction: PURCHASE });
  await service.execute({ type: "transaction.delete", id: saved.ledger.transactions[0].id });
  failSave = true;
  await expect(service.execute({ type: "settings.currency", currency: "EUR" })).rejects.toThrow("injected failure");
  expect((await service.snapshot()).canUndo).toBe(true);
  failSave = false;
  await service.execute({ type: "settings.currency", currency: "EUR" });
  expect((await service.snapshot()).canUndo).toBe(false);
  await expect(service.execute({ type: "undo" })).rejects.toThrow(/undo/i);
});
