import { describe, expect, it } from "vitest";
import { emptyLedger } from "../../contracts/ledger";
import { decodeLedger, validateCommand } from "../../contracts/validation";

describe("versioned ledger contract", () => {
  it("preserves a current ledger and upgrades the version-zero integer schema", () => {
    expect(decodeLedger(emptyLedger())).toEqual(emptyLedger());
    const previous = { version: 0, currency: "EUR", transactions: [
      { id: "old", date: "2024-02-29", payee: "Shop", amount: -123, category: "Food", note: "" },
    ] };
    expect(decodeLedger(previous)).toMatchObject({ version: 1, currency: "EUR", categories: ["Food"], transactions: previous.transactions });
  });

  it.each([null, { ...emptyLedger(), version: 99 }, { ...emptyLedger(), currency: "XYZ" },
    { ...emptyLedger(), transactions: [{ id: "x", date: "2025-02-29", payee: "Shop", amount: 10, category: null, note: "" }] },
    { ...emptyLedger(), transactions: [{ id: "x", date: "2026-01-01", payee: "Shop", amount: 1.2, category: null, note: "" }] },
  ])("rejects corrupt, future, invalid-date and fractional data", (value) => {
    expect(() => decodeLedger(value)).toThrow();
  });

  it("validates IPC payloads instead of trusting TypeScript", () => {
    expect(() => validateCommand({ type: "transaction.delete", id: "" })).toThrow();
    expect(() => validateCommand({ type: "surprise" })).toThrow();
    expect(validateCommand({ type: "settings.currency", currency: "USD" })).toEqual({ type: "settings.currency", currency: "USD" });
  });
});
