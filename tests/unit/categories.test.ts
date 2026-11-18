import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { LedgerService } from "../../backend/service";
import { memoryStore } from "../../backend/ports";
import { emptyLedger, type LedgerApi } from "../../contracts/ledger";
import { FileLedgerStore } from "../../persistence/file-store";
import { inspectCsv, previewCsv } from "../../domain/csv";
import { mock } from "../../src/api";
import { PURCHASE, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

describe("categories and ordered rules", () => {
  it("creates, renames and deletes without losing transactions", async () => {
    const service = new LedgerService(memoryStore());
    await service.execute({ type: "category.create", name: "Food" });
    await expect(service.execute({ type: "category.create", name: "Food" })).rejects.toThrow(/exists/);
    await service.execute({ type: "transaction.save", transaction: PURCHASE });
    await service.execute({ type: "rule.save", contains: "grocer", category: "Food" });
    const renamed = await service.execute({ type: "category.rename", name: "Food", to: "Groceries" });
    expect(renamed.ledger.transactions[0].category).toBe("Groceries");
    expect(renamed.ledger.rules[0].category).toBe("Groceries");
    const removed = await service.execute({ type: "category.delete", name: "Groceries" });
    expect(removed.ledger.transactions[0]).toMatchObject({ ...PURCHASE, category: null });
    expect(removed.ledger.rules).toEqual([]);
    expect(removed.ledger.categories).toEqual([]);
  });

  it("merges transaction, rule and budget references, summing colliding budgets exactly", async () => {
    const service = new LedgerService(memoryStore({ ...emptyLedger(), categories: ["Food", "Home"],
      budgets: [{ category: "Food", month: "2026-01", amount: 100 }, { category: "Home", month: "2026-01", amount: 200 }] }));
    await service.execute({ type: "transaction.save", transaction: PURCHASE });
    await service.execute({ type: "rule.save", contains: "grocer", category: "Food" });
    const merged = await service.execute({ type: "category.merge", source: "Food", target: "Home" });
    expect(merged.ledger.categories).toEqual(["Home"]);
    expect(merged.ledger.transactions[0]).toMatchObject({ ...PURCHASE, category: "Home" });
    expect(merged.ledger.rules[0].category).toBe("Home");
    expect(merged.ledger.budgets).toEqual([{ category: "Home", month: "2026-01", amount: 300 }]);
    await expect(service.execute({ type: "category.merge", source: "Home", target: "Home" })).rejects.toThrow(/same/);
  });

  it("uses the first case-insensitive match on imports and only uncategorised rows on request", async () => {
    const service = new LedgerService(memoryStore({ ...emptyLedger(), categories: ["Food", "Home"] }));
    const first = await service.execute({ type: "rule.save", contains: "gro", category: "Food" });
    await service.execute({ type: "rule.save", contains: "grocer", category: "Home" });
    await service.execute({ type: "transaction.save", transaction: { ...PURCHASE, category: null } });
    await service.execute({ type: "transaction.save", transaction: { ...PURCHASE, payee: "Grocer explicit", category: "Home" } });
    const applied = await service.execute({ type: "rule.apply" });
    expect(applied.ledger.transactions.map((item) => item.category)).toEqual(["Home", "Food"]);
    const csv = "Date,Payee,Amount\n2026-01-02,MegaGROCER,-0.01";
    expect(previewCsv((await service.snapshot()).ledger, csv, inspectCsv(csv).mapping).accepted[0].category).toBe("Food");
    const imported = await service.execute({ type: "csv.import", file: { name: "bank.csv", content: csv }, mapping: inspectCsv(csv).mapping });
    expect(imported.ledger.transactions[0].category).toBe("Food");
    expect((await service.execute({ type: "rule.delete", id: first.ledger.rules[0].id })).ledger.rules).toHaveLength(1);
  });
});

it("mock and real file storage agree on category reference changes", async () => {
  const directory = await temporaryDirectory();
  const scenario = async (api: LedgerApi) => {
    await api.execute({ type: "category.create", name: "Food" });
    await api.execute({ type: "transaction.save", transaction: PURCHASE });
    await api.execute({ type: "category.rename", name: "Food", to: "Groceries" });
    const result = await api.execute({ type: "category.delete", name: "Groceries" });
    return { categories: result.ledger.categories, category: result.ledger.transactions[0].category };
  };
  try { expect(await scenario(mock)).toEqual(await scenario(new LedgerService(new FileLedgerStore(join(directory, "ledger.json"))))); }
  finally { await removeTemporaryDirectory(directory); }
});
