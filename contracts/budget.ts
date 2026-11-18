import type { LedgerCommand } from "./ledger";
import { calendarDate, minorUnits, textValue } from "./primitives";

/** Budget month and amount are validated before the domain checks category existence. */
export function budgetCommand(command: Record<string, unknown>): Extract<LedgerCommand, { type: "budget.save" }> {
  const month = textValue(command.month, "Month");
  calendarDate(`${month}-01`);
  const amount = command.amount === null ? null : minorUnits(command.amount);
  if (amount !== null && amount < 0) throw new Error("Budget cannot be negative");
  return { type: "budget.save", category: textValue(command.category, "Category"), month, amount };
}
