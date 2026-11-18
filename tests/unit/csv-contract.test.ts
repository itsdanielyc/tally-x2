import { expect, it } from "vitest";
import { csvFile, csvMapping, type CsvMapping } from "../../contracts/csv";
import { validateCommand } from "../../contracts/validation";

const mapping: CsvMapping = { headerRow: 0, date: 0, payee: 1, amount: 2, debit: null, credit: null, category: null, note: null, dateOrder: "DMY", decimalSeparator: "." };

it("accepts a complete import command through the runtime contract", () => {
  const command = { type: "csv.import", file: { name: "bank.csv", content: "Date,Payee,Amount\n" }, mapping };
  expect(validateCommand(command)).toEqual(command);
});

it("rejects unmapped money, invalid indexes, bad orders and non-text files", () => {
  expect(() => csvMapping({ ...mapping, amount: null })).toThrow();
  expect(() => csvMapping({ ...mapping, date: -1 })).toThrow();
  expect(() => csvMapping({ ...mapping, dateOrder: "ABC" })).toThrow();
  expect(() => csvFile({ name: "bad.csv", content: null })).toThrow();
});

it("accepts CSV text beyond the former arbitrary file cap and header rows beyond column bounds", () => {
  const FORMER_FILE_LIMIT = 20 * 1024 * 1024;
  const content = "x".repeat(FORMER_FILE_LIMIT + 1);
  expect(csvFile({ name: "large.csv", content }).content).toBe(content);
  expect(csvMapping({ ...mapping, headerRow: 1000 }).headerRow).toBe(1000);
});
