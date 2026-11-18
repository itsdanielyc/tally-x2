import { csvMapping, type CsvMapping } from "../contracts/csv";
import type { Ledger, LedgerCommand, TransactionDraft } from "../contracts/ledger";
import { transactionDraft } from "../contracts/primitives";
import { detectCsv, suggestMapping } from "./csv-inspect";
import { csvAmount, csvDate } from "./csv-values";
import type { CsvRecord } from "./csv-reader";
import { ruleMatcher } from "./rules";

export interface CsvInspection { delimiter: string; headers: string[]; headerRow: number; headerLine: number; mapping: CsvMapping }
export interface ImportPreview { accepted: TransactionDraft[]; duplicates: number; errors: { line: number; reason: string }[] }

/** Inspect once for the mapping UI; preview and confirmation use the same detector. */
export function inspectCsv(source: string): CsvInspection {
  const document = detectCsv(source);
  const header = document.records[document.headerRow];
  return { delimiter: document.delimiter, headers: header?.fields ?? [], headerRow: document.headerRow,
    headerLine: header?.line ?? 1, mapping: suggestMapping(document) };
}

function duplicateKey(transaction: TransactionDraft): string {
  return JSON.stringify([transaction.date, transaction.amount, transaction.payee]);
}

function field(record: CsvRecord, column: number | null): string { return column === null ? "" : record.fields[column] ?? ""; }

function mappedAmount(record: CsvRecord, mapping: CsvMapping): number {
  if (mapping.amount !== null) return csvAmount(field(record, mapping.amount), mapping.decimalSeparator);
  const debitText = field(record, mapping.debit).trim();
  const creditText = field(record, mapping.credit).trim();
  const debit = debitText ? Math.abs(csvAmount(debitText, mapping.decimalSeparator)) : 0;
  const credit = creditText ? Math.abs(csvAmount(creditText, mapping.decimalSeparator)) : 0;
  if (debit && credit) throw new Error("Both debit and credit have an amount");
  if (!debitText && !creditText) throw new Error("Both debit and credit are empty");
  return credit - debit;
}

function readTransaction(record: CsvRecord, mapping: CsvMapping, columns: number): TransactionDraft {
  if (record.error) throw new Error(record.error);
  if (record.fields.length !== columns) throw new Error(`Expected ${columns} columns, found ${record.fields.length}`);
  return transactionDraft({ date: csvDate(field(record, mapping.date), mapping.dateOrder), payee: field(record, mapping.payee),
    amount: mappedAmount(record, mapping), category: field(record, mapping.category) || null, note: field(record, mapping.note) });
}

/** Time O(n+m), space O(n+m): exact identity Set prevents quadratic duplicate scans. */
export function previewCsv(ledger: Ledger, source: string, options: CsvMapping): ImportPreview {
  const mapping = csvMapping(options);
  const document = detectCsv(source);
  const header = document.records[mapping.headerRow];
  if (!header) throw new Error("CSV has no header row");
  const seen = new Set(ledger.transactions.map(duplicateKey));
  const match = ruleMatcher(ledger.rules);
  const preview: ImportPreview = { accepted: [], duplicates: 0, errors: [] };
  for (let index = mapping.headerRow + 1; index < document.records.length; index++) {
    const record = document.records[index];
    try {
      const transaction = readTransaction(record, mapping, header.fields.length);
      const key = duplicateKey(transaction);
      if (seen.has(key)) { preview.duplicates++; continue; }
      seen.add(key);
      transaction.category ??= match(transaction.payee);
      preview.accepted.push(transaction);
    } catch (error) {
      preview.errors.push({ line: record.line, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return preview;
}

/** Time O(n+m), space O(n+m): create one candidate state and commit it only once. */
export function importCsv(ledger: Ledger, command: Extract<LedgerCommand, { type: "csv.import" }>, createId: () => string): Ledger {
  const preview = previewCsv(ledger, command.file.content, command.mapping);
  if (!preview.accepted.length) return ledger;
  const categories = new Set(ledger.categories);
  const transactions = preview.accepted.map((transaction) => {
    const category = transaction.category;
    if (category !== null) categories.add(category);
    return { ...transaction, category, id: createId() };
  });
  return { ...ledger, categories: [...categories], transactions: [...transactions, ...ledger.transactions] };
}
