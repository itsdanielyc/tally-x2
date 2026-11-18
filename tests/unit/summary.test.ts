import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { emptyLedger } from "../../contracts/ledger";
import { LedgerService } from "../../backend/service";
import { FileLedgerStore } from "../../persistence/file-store";
import { summarizeMonth, shiftMonth } from "../../domain/summary";
import { formatMoney } from "../../domain/money";
import { mock } from "../../src/api";
import { PURCHASE, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

describe("monthly integer totals", () => {
  it("keeps leap-day boundaries, category net, income/spending and budget remaining exact", () => {
    const ledger = { ...emptyLedger(), categories: ["Food", "Salary"], budgets: [{ category: "Food", month: "2024-02", amount: 100 }], transactions: [
      { ...PURCHASE, id: "a", date: "2024-02-29", amount: -101 },
      { ...PURCHASE, id: "b", date: "2024-02-29", amount: 1 },
      { ...PURCHASE, id: "c", date: "2024-02-01", amount: 10000, category: "Salary" },
      { ...PURCHASE, id: "d", date: "2024-02-15", amount: -2, category: null },
      { ...PURCHASE, id: "e", date: "2024-03-01", amount: -999 },
    ] };
    const summary = summarizeMonth(ledger, "2024-02");
    expect(summary).toMatchObject({ income: 10001n, spending: 103n, net: 9898n, transactionCount: 4 });
    expect(summary.categories.find((item) => item.category === "Food")).toMatchObject({ net: -100n, spending: 101n, budget: 100, remaining: -1n });
    expect(summary.categories.reduce((total, item) => total + item.net, 0n)).toBe(summary.net);
  });

  it("matches an independent sum over a deterministic mix of income and spending", () => {
    const transactions = Array.from({ length: 120 }, (_, index) => ({ ...PURCHASE, id: String(index), category: index % 2 ? "Food" : null,
      date: index % 3 ? "2026-01-31" : "2026-02-01", amount: (index * 7919) % 200000 - 100000 }));
    const ledger = { ...emptyLedger(), categories: ["Food"], transactions };
    for (const month of ["2026-01", "2026-02"]) {
      const expected = transactions.filter((item) => item.date.startsWith(month)).reduce((total, item) => total + BigInt(item.amount), 0n);
      expect(summarizeMonth(ledger, month).net).toBe(expected);
    }
  });

  it("aggregates beyond Number's safe range and formats without losing a cent", () => {
    const ledger = { ...emptyLedger(), categories: ["Food"], transactions: [
      { ...PURCHASE, id: "a", amount: Number.MAX_SAFE_INTEGER }, { ...PURCHASE, id: "b", amount: Number.MAX_SAFE_INTEGER },
    ] };
    const summary = summarizeMonth(ledger, "2026-01");
    expect(summary.income).toBe(2n * BigInt(Number.MAX_SAFE_INTEGER));
    expect(formatMoney(summary.income, "GBP")).toBe("GBP 180143985094819.82");
  });

  it("moves across year boundaries and refuses unsupported calendar years", () => {
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(() => shiftMonth("0001-01", -1)).toThrow();
    expect(() => shiftMonth("9999-12", 1)).toThrow();
  });
});

it("persists month-specific budgets and agrees with the mock contract", async () => {
  const directory = await temporaryDirectory();
  try {
    const file = join(directory, "ledger.json");
    const real = new LedgerService(new FileLedgerStore(file));
    for (const api of [real, mock]) {
      await api.execute({ type: "category.create", name: "Food" });
      await api.execute({ type: "budget.save", category: "Food", month: "2026-01", amount: 100 });
      await api.execute({ type: "budget.save", category: "Food", month: "2026-02", amount: 200 });
      await api.execute({ type: "budget.save", category: "Food", month: "2026-01", amount: 150 });
    }
    expect((await real.snapshot()).ledger.budgets).toEqual((await mock.snapshot()).ledger.budgets);
    expect((await new LedgerService(new FileLedgerStore(file)).snapshot()).ledger.budgets).toHaveLength(2);
    expect((await real.execute({ type: "budget.save", category: "Food", month: "2026-01", amount: null })).ledger.budgets).toEqual([{ category: "Food", month: "2026-02", amount: 200 }]);
  } finally { await removeTemporaryDirectory(directory); }
});
