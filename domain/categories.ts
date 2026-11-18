import type { Ledger, LedgerCommand } from "../contracts/ledger";
import { sumMoney } from "./money";

/** A dangling category is an error before any state is written. */
export function requireCategory(ledger: Ledger, name: string): void {
  if (!ledger.categories.includes(name)) throw new Error("Category not found");
}

function requireNewName(ledger: Ledger, name: string): void {
  if (ledger.categories.includes(name)) throw new Error("Category already exists");
}

/** Time O(b), space O(b): a merge combines each category/month budget once. */
function retargetBudgets(budgets: Ledger["budgets"], source: string, target: string | null): Ledger["budgets"] {
  const combined = new Map<string, Ledger["budgets"][number]>();
  for (const budget of budgets) {
    const category = budget.category === source ? target : budget.category;
    if (category === null) continue;
    const key = JSON.stringify([category, budget.month]);
    const previous = combined.get(key);
    combined.set(key, { ...budget, category, amount: previous ? sumMoney([previous.amount, budget.amount]) : budget.amount });
  }
  return [...combined.values()];
}

/** Time O(t+r+b+c), space O(t+r+b+c): retarget every reference in one candidate. */
function retargetCategory(ledger: Ledger, source: string, target: string | null): Ledger {
  const categories = [...new Set(ledger.categories.map((name) => name === source ? target : name).filter((name): name is string => name !== null))];
  const transactions = ledger.transactions.map((item) => item.category === source ? { ...item, category: target } : item);
  const rules = ledger.rules.flatMap((rule) => {
    if (rule.category !== source) return [rule];
    return target === null ? [] : [{ ...rule, category: target }];
  });
  return { ...ledger, categories, transactions, rules, budgets: retargetBudgets(ledger.budgets, source, target) };
}

/** Only category operations are handled here; the backend composes command modules. */
export function applyCategoryCommand(ledger: Ledger, command: LedgerCommand): Ledger | undefined {
  switch (command.type) {
    case "category.create":
      requireNewName(ledger, command.name);
      return { ...ledger, categories: [...ledger.categories, command.name] };
    case "category.rename":
      requireCategory(ledger, command.name);
      if (command.name === command.to) return ledger;
      requireNewName(ledger, command.to);
      return retargetCategory(ledger, command.name, command.to);
    case "category.delete":
      requireCategory(ledger, command.name);
      return retargetCategory(ledger, command.name, null);
    case "category.merge":
      if (command.source === command.target) throw new Error("Cannot merge a category into the same category");
      requireCategory(ledger, command.source);
      requireCategory(ledger, command.target);
      return retargetCategory(ledger, command.source, command.target);
  }
}
