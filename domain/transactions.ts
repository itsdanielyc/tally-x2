import type { Ledger, LedgerCommand, Transaction } from "../contracts/ledger";

/** Time O(n), space O(n): immutable transaction mutation with stable insertion order. */
export function applyTransactionCommand(ledger: Ledger, command: LedgerCommand, createId: () => string): Ledger | undefined {
  switch (command.type) {
    case "settings.currency": return { ...ledger, currency: command.currency };
    case "transaction.delete": {
      if (!ledger.transactions.some((item) => item.id === command.id)) throw new Error("Transaction not found");
      return { ...ledger, transactions: ledger.transactions.filter((item) => item.id !== command.id) };
    }
    case "transaction.save": {
      if (command.id !== undefined && !ledger.transactions.some((item) => item.id === command.id)) throw new Error("Transaction not found");
      const transaction = { ...command.transaction, id: command.id ?? createId() };
      const transactions = command.id === undefined ? [transaction, ...ledger.transactions]
        : ledger.transactions.map((item) => item.id === command.id ? transaction : item);
      const category = transaction.category;
      const categories = category !== null && !ledger.categories.includes(category) ? [...ledger.categories, category] : ledger.categories;
      return { ...ledger, transactions, categories };
    }
  }
}

/** Time O(n log n), space O(n): newest dates first, stable entry order for ties. */
export function newestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => right.date.localeCompare(left.date));
}
