import type { CsvFile, CsvMapping } from "./csv";

/** Currency codes supported by this single-currency, two-decimal ledger. */
export const CURRENCIES = ["GBP", "EUR", "USD", "CAD", "AUD", "CHF"] as const;
export const LEDGER_VERSION = 1;
export type Currency = typeof CURRENCIES[number];

/** All amounts are safe integer minor units; dates are calendar dates. */
export interface TransactionDraft {
  date: string;
  payee: string;
  amount: number;
  category: string | null;
  note: string;
}

export interface Transaction extends TransactionDraft { id: string }
interface PayeeRule { id: string; contains: string; category: string }
interface MonthlyBudget { month: string; category: string; amount: number }

/** Reserved collections allow later fixed slices without a file-format fork. */
export interface Ledger {
  version: typeof LEDGER_VERSION;
  currency: Currency;
  transactions: Transaction[];
  categories: string[];
  rules: PayeeRule[];
  budgets: MonthlyBudget[];
}

export interface LedgerView { ledger: Ledger; canUndo: boolean }

export type LedgerCommand =
  | { type: "undo" }
  | { type: "budget.save"; category: string; month: string; amount: number | null }
  | { type: "category.create"; name: string }
  | { type: "category.rename"; name: string; to: string }
  | { type: "category.delete"; name: string }
  | { type: "category.merge"; source: string; target: string }
  | { type: "rule.save"; id?: string; contains: string; category: string }
  | { type: "rule.delete"; id: string }
  | { type: "rule.apply" }
  | { type: "csv.import"; file: CsvFile; mapping: CsvMapping }
  | { type: "transaction.save"; transaction: TransactionDraft; id?: string }
  | { type: "transaction.delete"; id: string }
  | { type: "settings.currency"; currency: Currency };

/** The same command surface is implemented by the native backend and mock. */
export interface LedgerApi {
  snapshot(): Promise<LedgerView>;
  execute(command: LedgerCommand): Promise<LedgerView>;
}

/** A newly created file always starts from the same explicit schema. */
export function emptyLedger(): Ledger {
  return { version: LEDGER_VERSION, currency: "GBP", transactions: [], categories: [], rules: [], budgets: [] };
}
