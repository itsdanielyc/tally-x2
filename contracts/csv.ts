import { objectValue, textValue } from "./primitives";

export const MAX_CSV_BYTES = 20 * 1024 * 1024;
const MAX_COLUMN_INDEX = 999;
export interface CsvFile { name: string; content: string }
export interface CsvMapping {
  headerRow: number;
  date: number;
  payee: number;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  category: number | null;
  note: number | null;
  dateOrder: "DMY" | "MDY" | "YMD";
  decimalSeparator: "." | ",";
}
function columnIndex(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > MAX_COLUMN_INDEX) throw new Error("Invalid CSV column index");
  return value;
}

function optionalColumn(value: unknown): number | null { return value === null ? null : columnIndex(value); }

/** Bound content before parsing; the native file boundary also checks bytes. */
export function csvFile(value: unknown): CsvFile {
  const file = objectValue(value);
  if (typeof file.content !== "string" || file.content.length > MAX_CSV_BYTES) throw new Error("CSV exceeds the 20 MiB limit");
  return { name: textValue(file.name, "CSV filename"), content: file.content };
}

/** Validate mappings even when callers bypass the renderer. */
export function csvMapping(value: unknown): CsvMapping {
  const mapping = objectValue(value);
  const headerRow = columnIndex(mapping.headerRow);
  const dateOrder = mapping.dateOrder;
  const decimalSeparator = mapping.decimalSeparator;
  if (dateOrder !== "DMY" && dateOrder !== "MDY" && dateOrder !== "YMD") throw new Error("Choose a date order");
  if (decimalSeparator !== "." && decimalSeparator !== ",") throw new Error("Choose a decimal separator");
  const amount = optionalColumn(mapping.amount);
  const debit = optionalColumn(mapping.debit);
  const credit = optionalColumn(mapping.credit);
  if (amount === null && (debit === null || credit === null)) throw new Error("Map a signed amount or both debit and credit columns");
  return { headerRow, date: columnIndex(mapping.date), payee: columnIndex(mapping.payee), amount, debit, credit,
    category: optionalColumn(mapping.category), note: optionalColumn(mapping.note), dateOrder, decimalSeparator };
}
