import type { Ledger } from "../contracts/ledger";
import type { TransactionFilter } from "../contracts/find";
import { findTransactions } from "./find";
import { decimalAmount } from "./money";

const CSV_HEADERS = ["Date", "Payee", "Amount", "Category", "Note", "Tally ID"];
function csvCell(text: string): string { return `"${text.replaceAll('"', '""')}"`; }

/** Time O(n log n + output), space O(n + output): the list and export share a selector. */
export function createCsvExport(ledger: Ledger, filter: TransactionFilter): { content: string; count: number } {
  const transactions = findTransactions(ledger.transactions, filter);
  const rows = [CSV_HEADERS, ...transactions.map((item) => [item.date, item.payee, decimalAmount(item.amount), item.category ?? "", item.note, item.id])];
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return { content, count: transactions.length };
}
