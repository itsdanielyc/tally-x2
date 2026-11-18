import type { Ledger, LedgerCommand } from "../contracts/ledger";
import { requireCategory } from "./categories";

/** Prepare normalized needles once per import/apply, preserving explicit rule order. */
export function ruleMatcher(rules: Ledger["rules"]): (payee: string) => string | null {
  const matchers = rules.map((rule) => ({ text: rule.contains.toLowerCase(), category: rule.category }));
  return (payee) => {
    const text = payee.toLowerCase();
    return matchers.find((rule) => text.includes(rule.text))?.category ?? null;
  };
}

/** Time O(t*r*s), space O(t+r); s is substring-search cost. Explicit categories win. */
function applyToUncategorised(ledger: Ledger): Ledger {
  const match = ruleMatcher(ledger.rules);
  let changed = false;
  const transactions = ledger.transactions.map((transaction) => {
    if (transaction.category !== null) return transaction;
    const category = match(transaction.payee);
    if (category === null) return transaction;
    changed = true;
    return { ...transaction, category };
  });
  return changed ? { ...ledger, transactions } : ledger;
}

/** Rule editing preserves its priority; new rules append after existing ones. */
export function applyRuleCommand(ledger: Ledger, command: LedgerCommand, createId: () => string): Ledger | undefined {
  switch (command.type) {
    case "rule.save": {
      requireCategory(ledger, command.category);
      if (command.id !== undefined && !ledger.rules.some((rule) => rule.id === command.id)) throw new Error("Rule not found");
      const rule = { id: command.id ?? createId(), contains: command.contains, category: command.category };
      const rules = command.id === undefined ? [...ledger.rules, rule] : ledger.rules.map((item) => item.id === command.id ? rule : item);
      return { ...ledger, rules };
    }
    case "rule.delete":
      if (!ledger.rules.some((rule) => rule.id === command.id)) throw new Error("Rule not found");
      return { ...ledger, rules: ledger.rules.filter((rule) => rule.id !== command.id) };
    case "rule.apply": return applyToUncategorised(ledger);
  }
}
