import type { CsvMapping } from "../contracts/csv";
import { calendarDate } from "../contracts/primitives";
import { parseMoney } from "./money";

const TWO_DIGIT_YEAR_PIVOT = 70;

/** Resolve the chosen date order and validate the resulting calendar date. */
export function csvDate(raw: string, order: CsvMapping["dateOrder"]): string {
  const text = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return calendarDate(text);
  const parts = text.split(/[-/.]/);
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) throw new Error("Date must have three numeric parts");
  const positions = order === "DMY" ? [2, 1, 0] : order === "MDY" ? [2, 0, 1] : [0, 1, 2];
  let year = parts[positions[0]];
  if (year.length === 2) year = String(Number(year) < TWO_DIGIT_YEAR_PIVOT ? 2000 + Number(year) : 1900 + Number(year));
  return calendarDate(`${year}-${parts[positions[1]].padStart(2, "0")}-${parts[positions[2]].padStart(2, "0")}`);
}

/** Parse grouped bank decimals with integer arithmetic and an explicit decimal mark. */
export function csvAmount(raw: string, decimal: CsvMapping["decimalSeparator"]): number {
  let text = raw.trim().replace(/^[£$€]\s*/, "").replaceAll("\u00a0", " ");
  const parentheses = text.startsWith("(") && text.endsWith(")");
  if (parentheses) text = text.slice(1, -1);
  const parts = text.split(decimal);
  if (parts.length > 2) throw new Error("Invalid decimal amount");
  let whole = parts[0];
  const grouping = decimal === "." ? "," : ".";
  const grouped = decimal === "." ? /^[+-]?\d{1,3}(?:,\d{3})+$/ : /^[+-]?\d{1,3}(?:\.\d{3})+$/;
  if (whole.includes(grouping)) {
    if (!grouped.test(whole)) throw new Error("Invalid thousands grouping");
    whole = whole.split(grouping).join("");
  }
  if (whole.includes(" ")) {
    if (!/^[+-]?\d{1,3}(?: \d{3})+$/.test(whole)) throw new Error("Invalid thousands grouping");
    whole = whole.replaceAll(" ", "");
  }
  return parseMoney(`${parentheses ? "-" : ""}${whole}${parts.length === 2 ? "." + parts[1] : ""}`);
}
