import { CURRENCIES, type Currency, type TransactionDraft } from "./ledger";

export const MAX_TEXT_LENGTH = 10_000;
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Narrow an untrusted IPC/file object before inspecting its fields. */
export function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
  return value as Record<string, unknown>;
}

/** Require a bounded, nonblank value, preserving user text including whitespace. */
export function textValue(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== "string" || value.length > MAX_TEXT_LENGTH || (!allowEmpty && !value.trim())) {
    throw new Error(`${label} must be ${allowEmpty ? "text" : "nonblank text"} up to ${MAX_TEXT_LENGTH} characters`);
  }
  return value;
}

/** Reject fractional, nonfinite or unsafe monetary values at every boundary. */
export function minorUnits(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error("Amount must be safe integer minor units");
  return value;
}

/** Validate real calendar dates without timezone conversion or Date rollover. */
export function calendarDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Date must use YYYY-MM-DD");
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const lastDay = month === 2 && leap ? 29 : DAYS_PER_MONTH[month - 1];
  if (year < 1 || !lastDay || day < 1 || day > lastDay) throw new Error("Date is not a valid calendar date");
  return value;
}

/** Supported currencies all have two minor decimal places. */
export function currencyValue(value: unknown): Currency {
  if (typeof value !== "string" || !CURRENCIES.some((code) => code === value)) throw new Error("Unsupported currency");
  return value as Currency;
}

/** Normalize absent category/note fields from historical files and IPC. */
export function transactionDraft(value: unknown): TransactionDraft {
  const fields = objectValue(value);
  return {
    date: calendarDate(fields.date),
    payee: textValue(fields.payee, "Payee"),
    amount: minorUnits(fields.amount),
    category: fields.category == null || fields.category === "" ? null : textValue(fields.category, "Category"),
    note: fields.note == null ? "" : textValue(fields.note, "Note", true),
  };
}
