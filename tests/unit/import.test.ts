import { expect, it } from "vitest";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { LedgerService } from "../../backend/service";
import { FileLedgerStore } from "../../persistence/file-store";
import { inspectCsv, previewCsv } from "../../domain/csv";
import { pickCsvFile } from "../../electron/files";
import { mock } from "../../src/api";
import type { LedgerApi } from "../../contracts/ledger";
import { removeTemporaryDirectory, temporaryDirectory } from "./helpers";

const CSV = "Date,Payee,Amount\n2026-01-01,Shop,-1.23\n2026-01-01,Shop,-1.23\n2026-01-02,Salary,10.00";

it("mock and real storage return the same import results", async () => {
  const directory = await temporaryDirectory();
  const importThroughContract = async (api: LedgerApi) => {
    const view = await api.execute({ type: "csv.import", file: { name: "bank.csv", content: CSV }, mapping: inspectCsv(CSV).mapping });
    expect(view.ledger.transactions).toHaveLength(2);
    return view.ledger.transactions.map((item) => ({ date: item.date, payee: item.payee, amount: item.amount, category: item.category, note: item.note }));
  };
  try {
    const real = new LedgerService(new FileLedgerStore(join(directory, "ledger.json")));
    expect(await importThroughContract(mock)).toEqual(await importThroughContract(real));
  } finally { await removeTemporaryDirectory(directory); }
});

it("imports accepted rows together and a repeat adds nothing", async () => {
  const directory = await temporaryDirectory();
  try {
    const service = new LedgerService(new FileLedgerStore(join(directory, "ledger.json")));
    const command = { type: "csv.import" as const, file: { name: "bank.csv", content: CSV }, mapping: inspectCsv(CSV).mapping };
    const first = await service.execute(command);
    expect(first.ledger.transactions).toHaveLength(2);
    expect(previewCsv(first.ledger, CSV, command.mapping).duplicates).toBe(3);
    expect((await service.execute(command)).ledger).toEqual(first.ledger);
  } finally { await removeTemporaryDirectory(directory); }
});

it("a failed save rolls back the entire import", async () => {
  const directory = await temporaryDirectory();
  try {
    const service = new LedgerService(new FileLedgerStore(join(directory, "ledger.json"), async () => { throw new Error("injected import failure"); }));
    const before = await service.snapshot();
    await expect(service.execute({ type: "csv.import", file: { name: "bank.csv", content: CSV }, mapping: inspectCsv(CSV).mapping })).rejects.toThrow("injected import failure");
    expect(await service.snapshot()).toEqual(before);
  } finally { await removeTemporaryDirectory(directory); }
});

it("imports 2,000 rows into the real file in under five seconds", async () => {
  const directory = await temporaryDirectory();
  try {
    const service = new LedgerService(new FileLedgerStore(join(directory, "ledger.json")));
    const csv = "Date,Payee,Amount\n" + Array.from({ length: 2000 }, (_, index) => `2026-01-01,Shop ${index},-0.01`).join("\n");
    const start = performance.now();
    const view = await service.execute({ type: "csv.import", file: { name: "large.csv", content: csv }, mapping: inspectCsv(csv).mapping });
    expect(view.ledger.transactions).toHaveLength(2000);
    expect(performance.now() - start).toBeLessThan(5000);
  } finally { await removeTemporaryDirectory(directory); }
});

it("reads a picked UTF-8 CSV and cancellation returns no file", async () => {
  const directory = await temporaryDirectory();
  try {
    const file = join(directory, "source.csv");
    await writeFile(file, "\ufeff" + CSV, "utf8");
    expect(await pickCsvFile(async () => undefined)).toBeNull();
    expect(await pickCsvFile(async () => file)).toEqual({ name: "source.csv", content: CSV });
  } finally { await removeTemporaryDirectory(directory); }
});
