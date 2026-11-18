import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FileLedgerStore } from "../../persistence/file-store";
import { LedgerService } from "../../backend/service";
import { PURCHASE, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

let directory: string;
beforeEach(async () => { directory = await temporaryDirectory(); });
afterEach(async () => { await removeTemporaryDirectory(directory); });

describe("real ledger file", () => {
  it("persists exact records and currency across service restarts", async () => {
    const file = join(directory, "ledger.json");
    const service = new LedgerService(new FileLedgerStore(file));
    await service.execute({ type: "settings.currency", currency: "EUR" });
    const saved = await service.execute({ type: "transaction.save", transaction: PURCHASE });
    const reopened = await new LedgerService(new FileLedgerStore(file)).snapshot();
    expect(reopened.ledger).toEqual(saved.ledger);
    expect(JSON.parse(await readFile(file, "utf8")).version).toBe(1);
    expect(await readdir(directory)).toEqual(["ledger.json"]);
  });

  it("never overwrites corrupt or future-version data", async () => {
    const file = join(directory, "ledger.json");
    await writeFile(file, "{broken");
    const service = new LedgerService(new FileLedgerStore(file));
    await expect(service.snapshot()).rejects.toThrow(/open ledger/i);
    await expect(service.execute({ type: "transaction.save", transaction: PURCHASE })).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("{broken");
  });

  it("a failed replacement leaves disk and visible state unchanged", async () => {
    const file = join(directory, "ledger.json");
    const good = new LedgerService(new FileLedgerStore(file));
    const before = await good.execute({ type: "transaction.save", transaction: PURCHASE });
    const bytes = await readFile(file, "utf8");
    const failing = new LedgerService(new FileLedgerStore(file, async () => { throw new Error("injected rename failure"); }));
    await expect(failing.execute({ type: "transaction.save", transaction: { ...PURCHASE, payee: "Other" } })).rejects.toThrow("injected rename failure");
    expect(await failing.snapshot()).toEqual(before);
    expect(await readFile(file, "utf8")).toBe(bytes);
    expect(await readdir(directory)).toEqual(["ledger.json"]);
  });
});
