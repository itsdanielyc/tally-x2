import { describe, expect, it } from "vitest";
import { LedgerService } from "../../backend/service";
import { memoryStore } from "../../backend/ports";
import { formatMoney, parseMoney } from "../../domain/money";
import { PURCHASE } from "./helpers";

describe("integer money", () => {
  it.each([["-12.34", -1234], ["+0.01", 1], ["0", 0], ["90071992547409.91", Number.MAX_SAFE_INTEGER]])("parses %s exactly", (text, amount) => {
    expect(parseMoney(text)).toBe(amount);
    expect(formatMoney(amount, "GBP")).toBe(`GBP ${text === "+0.01" ? "0.01" : text === "0" ? "0.00" : text}`);
  });
  it.each(["", "1.001", "1e3", "NaN", "90071992547409.92"])("rejects invalid money %s", (text) => {
    expect(() => parseMoney(text)).toThrow();
  });
});

describe("transaction commands", () => {
  it("adds, edits and deletes without changing unrelated records", async () => {
    const service = new LedgerService(memoryStore());
    const first = await service.execute({ type: "transaction.save", transaction: PURCHASE });
    const id = first.ledger.transactions[0].id;
    expect(first.ledger.transactions[0]).toMatchObject(PURCHASE);
    expect(first.ledger.categories).toEqual(["Food"]);
    const edited = await service.execute({ type: "transaction.save", id, transaction: { ...PURCHASE, amount: -999 } });
    expect(edited.ledger.transactions[0]).toMatchObject({ id, amount: -999 });
    await expect(service.execute({ type: "transaction.delete", id: "missing" })).rejects.toThrow(/not found/i);
    expect((await service.execute({ type: "transaction.delete", id })).ledger.transactions).toEqual([]);
  });

  it("serializes simultaneous mutations and rejects invalid IPC values", async () => {
    const service = new LedgerService(memoryStore());
    await Promise.all(Array.from({ length: 20 }, (_, index) => service.execute({ type: "transaction.save", transaction: { ...PURCHASE, payee: `Shop ${index}` } })));
    expect((await service.snapshot()).ledger.transactions).toHaveLength(20);
    await expect(service.execute({ type: "transaction.save", transaction: { ...PURCHASE, amount: 0.1 } })).rejects.toThrow(/integer/);
  });
});
