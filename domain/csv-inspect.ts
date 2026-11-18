import type { CsvMapping } from "../contracts/csv";
import { CsvReader, type CsvRecord } from "./csv-reader";

type ColumnName = "date" | "payee" | "amount" | "debit" | "credit" | "category" | "note" | "tallyId";
const ALIASES: Record<ColumnName, string[]> = {
  date: ["date", "transactiondate", "bookingdate", "posteddate"],
  payee: ["payee", "description", "merchant", "details", "transactiondescription"],
  amount: ["amount", "value", "signedamount", "transactionamount"],
  debit: ["debit", "debitamount", "paidout", "withdrawal", "moneyout"],
  credit: ["credit", "creditamount", "paidin", "deposit", "moneyin"],
  category: ["category"], note: ["note", "notes", "memo"],
  tallyId: ["tallyid"],
};
const DELIMITERS = [",", ";", "\t", "|"];
const HEADER_SEARCH_ROWS = 50;
const HEADER_MATCH_WEIGHT = 100;
const SNIFF_CHARACTERS = 64 * 1024;
const MIN_HEADER_MATCHES = 2;
const MIN_TRANSACTION_COLUMNS = 3;
const DATE_LIKE = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:$|[T\s,;|])/;

export interface CsvDocument { delimiter: string; headerRow: number; records: CsvRecord[] }

function normalized(value: string): string { return value.toLowerCase().replace(/[^a-z]/g, ""); }
function findColumn(headers: string[], name: ColumnName): number | null {
  const index = headers.findIndex((header) => ALIASES[name].includes(normalized(header)));
  return index < 0 ? null : index;
}

function headerScore(record: CsvRecord): number {
  if (record.error) return -1;
  const matches = Object.keys(ALIASES).filter((key) => findColumn(record.fields, key as ColumnName) !== null).length;
  return matches * HEADER_MATCH_WEIGHT + record.fields.length;
}

function headerRow(records: CsvRecord[]): number {
  let fallback = -1;
  let tabular = -1;
  let best = -1;
  let matches = MIN_HEADER_MATCHES - 1;
  for (let index = 0; index < Math.min(records.length, HEADER_SEARCH_ROWS); index++) {
    const record = records[index];
    if (record.error || record.fields.some((field) => DATE_LIKE.test(field.trim()))) continue;
    if (fallback < 0) fallback = index;
    if (tabular < 0 && record.fields.length >= MIN_TRANSACTION_COLUMNS) tabular = index;
    const count = Object.keys(ALIASES).filter((key) => findColumn(record.fields, key as ColumnName) !== null).length;
    if (count > matches) { best = index; matches = count; }
  }
  return best >= 0 ? best : tabular >= 0 ? tabular : fallback;
}

/** Time O(n), space O(n): sniff bounded candidates, then parse the document once. */
export function detectCsv(source: string): CsvDocument {
  let bestDelimiter = ",";
  let bestScore = -1;
  let bestLine = Number.MAX_SAFE_INTEGER;
  for (const delimiter of DELIMITERS) {
    const records = new CsvReader(delimiter).read(source.slice(0, SNIFF_CHARACTERS));
    const header = records[headerRow(records)];
    const score = header ? headerScore(header) : -1;
    if (score > bestScore || (score === bestScore && header && header.line < bestLine)) {
      bestDelimiter = delimiter; bestScore = score; bestLine = header?.line ?? bestLine;
    }
  }
  const records = new CsvReader(bestDelimiter).read(source);
  return { delimiter: bestDelimiter, records, headerRow: headerRow(records) };
}

/** Suggest recognizable columns while leaving every field editable by the person. */
export function suggestMapping(document: CsvDocument): CsvMapping {
  const headers = document.records[document.headerRow]?.fields ?? [];
  const date = findColumn(headers, "date") ?? 0;
  const firstDate = document.records[document.headerRow + 1]?.fields[date] ?? "";
  const tallyId = findColumn(headers, "tallyId");
  return {
    ...(tallyId === null ? {} : { tallyId }),
    headerRow: document.headerRow, date, payee: findColumn(headers, "payee") ?? 1,
    amount: findColumn(headers, "amount"), debit: findColumn(headers, "debit"), credit: findColumn(headers, "credit"),
    category: findColumn(headers, "category"), note: findColumn(headers, "note"),
    dateOrder: /^\d{4}[-/.]/.test(firstDate) ? "YMD" : "DMY", decimalSeparator: document.delimiter === ";" ? "," : ".",
  };
}
