import { expect, it } from "vitest";
import { csvFile, csvMapping, MAX_CSV_BYTES, type CsvMapping } from "../../contracts/csv";
import { validateCommand } from "../../contracts/validation";

const mapping: CsvMapping = { headerRow: 0, date: 0, payee: 1, amount: 2, debit: null, credit: null, category: null, note: null, dateOrder: "DMY", decimalSeparator: "." };

it("accepts a complete import command through the runtime contract", () => {
  const command = { type: "csv.import", file: { name: "bank.csv", content: "Date,Payee,Amount\n" }, mapping };
  expect(validateCommand(command)).toEqual(command);
});

it("rejects unmapped money, invalid indexes, bad orders and oversized files", () => {
  expect(() => csvMapping({ ...mapping, amount: null })).toThrow();
  expect(() => csvMapping({ ...mapping, date: -1 })).toThrow();
  expect(() => csvMapping({ ...mapping, dateOrder: "ABC" })).toThrow();
  expect(() => csvFile({ name: "large.csv", content: "x".repeat(MAX_CSV_BYTES + 1) })).toThrow();
});
