import { minorUnits } from "../contracts/primitives";

const MINOR_UNITS_PER_MAJOR = 100n;
const MAX_AMOUNT_TEXT_LENGTH = 32;

/** Parse decimal text with integer arithmetic, never a floating-point amount. */
export function parseMoney(text: string): number {
  if (text.length > MAX_AMOUNT_TEXT_LENGTH) throw new Error("Amount is too large");
  const match = /^([+-]?)(\d+)(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) throw new Error("Enter an amount with at most two decimal places");
  const [, sign, whole, fraction = ""] = match;
  const magnitude = BigInt(whole) * MINOR_UNITS_PER_MAJOR + BigInt(fraction.padEnd(2, "0"));
  return minorUnits(Number(sign === "-" ? -magnitude : magnitude));
}

/** Format an integer amount exactly, including values near Number's safe limit. */
export function decimalAmount(amount: number | bigint): string {
  const integer = typeof amount === "bigint" ? amount : BigInt(minorUnits(amount));
  const absolute = integer < 0n ? -integer : integer;
  return `${integer < 0n ? "-" : ""}${absolute / MINOR_UNITS_PER_MAJOR}.${String(absolute % MINOR_UNITS_PER_MAJOR).padStart(2, "0")}`;
}

/** Currency is explicit so text copied out of a ledger is unambiguous. */
export function formatMoney(amount: number | bigint, currency: string): string {
  return `${currency} ${decimalAmount(amount)}`;
}

/** Time O(n), space O(1): aggregate exactly before checking the safe integer bound. */
export function sumMoney(amounts: Iterable<number>): number {
  let total = 0n;
  for (const amount of amounts) total += BigInt(minorUnits(amount));
  return minorUnits(Number(total));
}
