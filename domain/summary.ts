import type { Ledger } from "../contracts/ledger";
import { calendarDate } from "../contracts/primitives";
export interface CategorySummary { category: string | null; income: bigint; spending: bigint; net: bigint; budget: number | null; remaining: bigint | null }
export interface MonthlySummary { month: string; income: bigint; spending: bigint; net: bigint; transactionCount: number; categories: CategorySummary[] }

interface Totals { income: bigint; spending: bigint }
const MONTHS_PER_YEAR = 12;
const MAX_SUPPORTED_YEAR = 9999;

function emptyTotals(): Totals { return { income: 0n, spending: 0n }; }
function accumulate(totals: Totals, amount: bigint): void {
  if (amount > 0n) totals.income += amount;
  else totals.spending -= amount;
}

/** Time O(t+c+b), space O(c+b): BigInt totals stay exact beyond safe Number sums. */
export function summarizeMonth(ledger: Ledger, month: string): MonthlySummary {
  calendarDate(`${month}-01`);
  const groups = new Map<string | null, Totals>();
  for (const category of ledger.categories) groups.set(category, emptyTotals());
  const budgets = new Map<string, number>();
  for (const budget of ledger.budgets) if (budget.month === month) budgets.set(budget.category, budget.amount);
  const totals = emptyTotals();
  let transactionCount = 0;
  for (const transaction of ledger.transactions) {
    if (transaction.date.slice(0, 7) !== month) continue;
    const amount = BigInt(transaction.amount);
    const category = groups.get(transaction.category) ?? emptyTotals();
    accumulate(category, amount);
    groups.set(transaction.category, category);
    accumulate(totals, amount);
    transactionCount++;
  }
  const categories: CategorySummary[] = [...groups].map(([category, values]) => {
    const budget = category === null ? null : budgets.get(category) ?? null;
    return { category, ...values, net: values.income - values.spending, budget,
      remaining: budget === null ? null : BigInt(budget) - values.spending };
  });
  return { month, ...totals, net: totals.income - totals.spending, transactionCount, categories };
}

/** Calendar arithmetic avoids timezone and JavaScript's special handling of years 0-99. */
export function shiftMonth(month: string, direction: -1 | 1): string {
  calendarDate(`${month}-01`);
  const [year, monthNumber] = month.split("-").map(Number);
  const index = (year - 1) * MONTHS_PER_YEAR + monthNumber - 1 + direction;
  if (index < 0 || index >= MAX_SUPPORTED_YEAR * MONTHS_PER_YEAR) throw new Error("Month outside supported calendar range");
  return `${String(Math.floor(index / MONTHS_PER_YEAR) + 1).padStart(4, "0")}-${String(index % MONTHS_PER_YEAR + 1).padStart(2, "0")}`;
}
