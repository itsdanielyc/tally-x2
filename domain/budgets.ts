import type { Ledger, LedgerCommand } from "../contracts/ledger";
import { requireCategory } from "./categories";

/** One value per category/month; an empty amount removes that month's budget. */
export function applyBudgetCommand(ledger: Ledger, command: LedgerCommand): Ledger | undefined {
  if (command.type !== "budget.save") return undefined;
  requireCategory(ledger, command.category);
  const matches = (budget: Ledger["budgets"][number]): boolean => budget.category === command.category && budget.month === command.month;
  const previous = ledger.budgets.find(matches);
  if (command.amount === null) return previous ? { ...ledger, budgets: ledger.budgets.filter((budget) => !matches(budget)) } : ledger;
  if (previous?.amount === command.amount) return ledger;
  const next = { category: command.category, month: command.month, amount: command.amount };
  return { ...ledger, budgets: previous ? ledger.budgets.map((budget) => matches(budget) ? next : budget) : [...ledger.budgets, next] };
}
