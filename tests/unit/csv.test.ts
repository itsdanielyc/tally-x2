import { describe, expect, it } from "vitest";
import { emptyLedger } from "../../contracts/ledger";
import { inspectCsv, previewCsv } from "../../domain/csv";

const BANK = 'Bank export\r\nDate;Description;Debit;Credit\r\n31/01/2026;"Cafe; ""Central""";12,34;\r\n01/02/2026;Salary;;1000,00\r\n31/02/2026;Bad;1,00;\r\n01/02/2026;Salary;;1000,00';

describe("CSV importer used by preview and confirmation", () => {
  it("never promotes a dated transaction to header because its payee matches an alias", () => {
    const csv = "Posted,Name,Money\n2026-01-01,Debit,-1.00\n2026-01-02,Corner shop,-2.00";
    const inspection = inspectCsv(csv);
    expect(inspection.headerLine).toBe(1);
    const preview = previewCsv(emptyLedger(), csv, { ...inspection.mapping, date: 0, payee: 1, amount: 2 });
    expect(preview.accepted.map((item) => item.payee)).toEqual(["Debit", "Corner shop"]);
    expect(preview.errors).toEqual([]);
  });
  it("detects a semicolon header after a preamble, maps debit/credit and reports exact lines", () => {
    const inspection = inspectCsv(BANK);
    expect(inspection).toMatchObject({ delimiter: ";", headerRow: 1, headers: ["Date", "Description", "Debit", "Credit"] });
    const preview = previewCsv(emptyLedger(), BANK, { ...inspection.mapping, dateOrder: "DMY", decimalSeparator: "," });
    expect(preview.accepted.map((item) => [item.date, item.payee, item.amount])).toEqual([
      ["2026-01-31", 'Cafe; "Central"', -1234], ["2026-02-01", "Salary", 100000],
    ]);
    expect(preview.duplicates).toBe(1);
    expect(preview.errors).toEqual([{ line: 5, reason: expect.stringMatching(/calendar date/) }]);
  });

  it("preserves escaped quotes, commas and multiline notes; tracks following physical line numbers", () => {
    const csv = 'Date,Payee,Amount,Note\r\n2026-01-01,"A, ""B""",-1.01,"line1\r\nline2"\r\n2026-01-02,Next,wat,';
    const preview = previewCsv(emptyLedger(), csv, inspectCsv(csv).mapping);
    expect(preview.accepted[0]).toMatchObject({ payee: 'A, "B"', amount: -101, note: "line1\r\nline2" });
    expect(preview.errors[0]).toMatchObject({ line: 4 });
  });

  it("respects MDY order, grouping and decimal commas without floating amounts", () => {
    const csv = 'Date;Payee;Amount\n01/02/2026;Shop;(1.234,56)';
    const mapping = { ...inspectCsv(csv).mapping, dateOrder: "MDY" as const, decimalSeparator: "," as const };
    expect(previewCsv(emptyLedger(), csv, mapping).accepted[0]).toMatchObject({ date: "2026-01-02", amount: -123456 });
  });

  it("rejects unclosed quoted rows and conflicting debit/credit values", () => {
    const broken = 'Date,Payee,Amount\n2026-01-01,"Broken,-1.00\n';
    expect(previewCsv(emptyLedger(), broken, inspectCsv(broken).mapping).errors[0]).toMatchObject({ line: 2, reason: expect.stringMatching(/quote/i) });
    const conflict = 'Date,Payee,Debit,Credit\n2026-01-01,Shop,1.00,2.00';
    expect(previewCsv(emptyLedger(), conflict, inspectCsv(conflict).mapping).errors[0].reason).toMatch(/both debit and credit/i);
  });
});
