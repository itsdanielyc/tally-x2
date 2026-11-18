import type { Transaction } from "../contracts/ledger";
import { validateFilter, type TransactionFilter } from "../contracts/find";
import { newestFirst } from "./transactions";

function matchesTransaction(transaction: Transaction, filter: TransactionFilter, search: string): boolean {
  if (filter.category !== undefined && transaction.category !== filter.category) return false;
  if (filter.dateFrom !== null && transaction.date < filter.dateFrom) return false;
  if (filter.dateTo !== null && transaction.date > filter.dateTo) return false;
  if (filter.minimumAmount !== null && transaction.amount < filter.minimumAmount) return false;
  if (filter.maximumAmount !== null && transaction.amount > filter.maximumAmount) return false;
  return !search || transaction.payee.toLowerCase().includes(search) || transaction.note.toLowerCase().includes(search);
}

/** Time O(n log n + n*s), space O(n); s is text search cost, with one result array. */
export function findTransactions(transactions: Transaction[], options: TransactionFilter): Transaction[] {
  const filter = validateFilter(options);
  const search = filter.search.trim().toLowerCase();
  return newestFirst(transactions, (transaction) => matchesTransaction(transaction, filter, search));
}
