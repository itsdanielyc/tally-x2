import { expect, it } from "vitest";
import { join } from "node:path";
import { readFile, symlink, writeFile } from "node:fs/promises";
import { emptyLedger } from "../../contracts/ledger";
import { defaultFilter } from "../../contracts/find";
import { createCsvExport } from "../../domain/export";
import { inspectCsv, previewCsv } from "../../domain/csv";
import { LedgerService } from "../../backend/service";
import { memoryStore } from "../../backend/ports";
import { FileLedgerStore } from "../../persistence/file-store";
import { exportCsvFile } from "../../electron/files";
import { PURCHASE, removeTemporaryDirectory, temporaryDirectory } from "./helpers";

const ledger = { ...emptyLedger(), categories: ["Food"], transactions: [
  { ...PURCHASE, id: "a", payee: 'Shop, "Quoted"', note: "line1\r\nline2" },
  { ...PURCHASE, id: "b", payee: 'Shop, "Quoted"', note: "A distinct same-price purchase" },
  { ...PURCHASE, id: "c", date: "2026-02-01", category: null, amount: 1, note: "" },
] };

it("exports selected rows and imports exact transactions, including duplicate identities and multiline text", async () => {
  const exported = createCsvExport(ledger, defaultFilter());
  expect(exported.count).toBe(3);
  const mapping = inspectCsv(exported.content).mapping;
  const preview = previewCsv(emptyLedger(), exported.content, mapping);
  expect(preview.errors).toEqual([]);
  expect(preview.accepted).toHaveLength(3);
  const imported = await new LedgerService(memoryStore()).execute({ type: "csv.import", file: { name: "tally.csv", content: exported.content }, mapping });
  const byId = (left: { id: string }, right: { id: string }) => left.id.localeCompare(right.id);
  expect([...imported.ledger.transactions].sort(byId)).toEqual([...ledger.transactions].sort(byId));
  expect(previewCsv(imported.ledger, exported.content, mapping).duplicates).toBe(3);
  expect(createCsvExport(ledger, { ...defaultFilter(), category: "Food" }).count).toBe(2);
});

it("native export is atomic, cancellation changes nothing, and the ledger cannot be an export target", async () => {
  const directory = await temporaryDirectory();
  try {
    const ledgerFile = join(directory, "ledger.json");
    const store = new FileLedgerStore(ledgerFile);
    await store.save(ledger);
    const service = new LedgerService(store);
    const destination = join(directory, "tally.csv");
    const receipt = await exportCsvFile(service, defaultFilter(), async () => destination, ledgerFile);
    expect(receipt).toEqual({ name: "tally.csv", count: 3 });
    expect(await readFile(destination, "utf8")).toBe(createCsvExport(ledger, defaultFilter()).content);
    expect(await exportCsvFile(service, defaultFilter(), async () => undefined, ledgerFile)).toBeNull();
    const bytes = await readFile(ledgerFile, "utf8");
    await expect(exportCsvFile(service, defaultFilter(), async () => ledgerFile, ledgerFile)).rejects.toThrow(/ledger file/);
    expect(await readFile(ledgerFile, "utf8")).toBe(bytes);
    await writeFile(destination, "previous CSV");
    await expect(exportCsvFile(service, defaultFilter(), async () => destination, ledgerFile, async () => { throw new Error("export failure"); })).rejects.toThrow("export failure");
    expect(await readFile(destination, "utf8")).toBe("previous CSV");
  } finally { await removeTemporaryDirectory(directory); }
});

it("protects a not-yet-created ledger reached through a directory alias", async () => {
  const directory = await temporaryDirectory();
  try {
    const alias = join(directory, "alias");
    await symlink(directory, alias, process.platform === "win32" ? "junction" : "dir");
    const service = new LedgerService(memoryStore());
    await expect(exportCsvFile(service, defaultFilter(), async () => join(alias, "ledger.json"), join(directory, "ledger.json"))).rejects.toThrow(/ledger file/);
  } finally { await removeTemporaryDirectory(directory); }
});
