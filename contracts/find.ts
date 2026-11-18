import { calendarDate, minorUnits, objectValue, textValue } from "./primitives";

export interface TransactionFilter {
  search: string;
  category: string | null | undefined;
  dateFrom: string | null;
  dateTo: string | null;
  minimumAmount: number | null;
  maximumAmount: number | null;
}
export interface ExportReceipt { name: string; count: number }

/** Every read-only query starts from its own filter value. */
export function defaultFilter(): TransactionFilter {
  return { search: "", category: undefined, dateFrom: null, dateTo: null, minimumAmount: null, maximumAmount: null };
}

function optionalDate(value: unknown): string | null { return value == null || value === "" ? null : calendarDate(value); }
function optionalAmount(value: unknown): number | null { return value == null ? null : minorUnits(value); }

/** Validate inclusive ranges before either a list or an export reads the ledger. */
export function validateFilter(value: unknown): TransactionFilter {
  const fields = objectValue(value);
  const dateFrom = optionalDate(fields.dateFrom);
  const dateTo = optionalDate(fields.dateTo);
  const minimumAmount = optionalAmount(fields.minimumAmount);
  const maximumAmount = optionalAmount(fields.maximumAmount);
  if (dateFrom !== null && dateTo !== null && dateFrom > dateTo) throw new Error("Start date must not follow end date");
  if (minimumAmount !== null && maximumAmount !== null && minimumAmount > maximumAmount) throw new Error("Minimum amount must not exceed maximum amount");
  const category = fields.category === undefined ? undefined : fields.category === null ? null : textValue(fields.category, "Category");
  return { search: fields.search === undefined ? "" : textValue(fields.search, "Search", true), category, dateFrom, dateTo, minimumAmount, maximumAmount };
}
