import type { CsvMapping } from "../contracts/csv";
import { CsvReader, type CsvRecord } from "./csv-reader";

type ColumnName = "date" | "payee" | "amount" | "debit" | "credit" | "category" | "note";
const ALIASES: Record<ColumnName, string[]> = {
  date: ["date", "transactiondate", "bookingdate", "posteddate"],
  payee: ["payee", "description", "merchant", "details", "transactiondescription"],
  amount: ["amount", "value", "signedamount", "transactionamount"],
  debit: ["debit", "debitamount", "paidout", "withdrawal", "moneyout"],
  credit: ["credit", "creditamount", "paidin", "deposit", "moneyin"],
  category: ["category"], note: ["note", "notes", "memo"],
};
const DELIMITERS = [",", ";", "\t", "|"];
const HEADER_SEARCH_ROWS = 50;
const HEADER_MATCH_WEIGHT = 100;

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

/** Time O(n), space O(n): four bounded delimiter candidates, then one best document. */
export function detectCsv(source: string): CsvDocument {
  let best: CsvDocument = { delimiter: ",", headerRow: 0, records: [] };
  let bestScore = -1;
  for (const delimiter of DELIMITERS) {
    const records = new CsvReader(delimiter).read(source);
    for (let index = 0; index < Math.min(records.length, HEADER_SEARCH_ROWS); index++) {
      const score = headerScore(records[index]);
      if (score > bestScore) { best = { delimiter, records, headerRow: index }; bestScore = score; }
    }
  }
  return best;
}

/** Suggest recognizable columns while leaving every field editable by the person. */
export function suggestMapping(document: CsvDocument): CsvMapping {
  const headers = document.records[document.headerRow]?.fields ?? [];
  const date = findColumn(headers, "date") ?? 0;
  const firstDate = document.records[document.headerRow + 1]?.fields[date] ?? "";
  return {
    headerRow: document.headerRow, date, payee: findColumn(headers, "payee") ?? 1,
    amount: findColumn(headers, "amount"), debit: findColumn(headers, "debit"), credit: findColumn(headers, "credit"),
    category: findColumn(headers, "category"), note: findColumn(headers, "note"),
    dateOrder: /^\d{4}[-/.]/.test(firstDate) ? "YMD" : "DMY", decimalSeparator: document.delimiter === ";" ? "," : ".",
  };
}
