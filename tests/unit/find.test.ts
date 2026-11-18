import { expect, it } from "vitest";
import { defaultFilter } from "../../contracts/find";
import { findTransactions } from "../../domain/find";
import { PURCHASE } from "./helpers";

const transactions = [
  { ...PURCHASE, id: "a", date: "2026-01-01", payee: "Corner Grocer", note: "Weekly food" },
  { ...PURCHASE, id: "b", date: "2026-01-31", payee: "Hardware", category: "Home", note: "GROCERY shelf", amount: -999 },
  { ...PURCHASE, id: "c", date: "2026-02-01", payee: "Other", category: null, note: "", amount: 0 },
  { ...PURCHASE, id: "d", date: "2026-01-15", payee: "Salary", category: "Income", note: "", amount: 100000 },
];

it("finds payee and note text case-insensitively, newest first, without mutating state", () => {
  expect(findTransactions(transactions, { ...defaultFilter(), search: "grocer" }).map((item) => item.id)).toEqual(["b", "a"]);
  expect(transactions.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
});

it("combines category, inclusive calendar and exact amount ranges, including zero", () => {
  const filter = { ...defaultFilter(), category: "Food", dateFrom: "2026-01-01", dateTo: "2026-01-31", minimumAmount: -1234, maximumAmount: -1234 };
  expect(findTransactions(transactions, filter).map((item) => item.id)).toEqual(["a"]);
  expect(findTransactions(transactions, { ...defaultFilter(), category: null, minimumAmount: 0, maximumAmount: 0 }).map((item) => item.id)).toEqual(["c"]);
});
