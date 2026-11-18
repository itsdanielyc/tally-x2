import type { Transaction } from "../../contracts/ledger";
import { MAX_TEXT_LENGTH } from "../../contracts/primitives";
import { decimalAmount, formatMoney, parseMoney } from "../../domain/money";
import { findTransactions } from "../../domain/find";
import { backend } from "../api";
import { currentFilter, filtersView } from "./filters";
import { escapeHtml, fieldValue, requiredElement, today } from "./dom";
import type { ViewContext } from "./context";

/** Render the single transaction editor and newest-first ledger list. */
export function transactionsView(context: ViewContext): HTMLElement {
  const section = document.createElement("section");
  section.innerHTML = `<div class="section-heading" data-geo="section-title"><div><p class="eyebrow">YOUR LEDGER</p><h2>Transactions</h2></div><span class="muted">${context.view.ledger.transactions.length} recorded</span></div>
    <div class="panel" data-geo="editor"><h3 id="editor-heading">Add transaction</h3>
    <form id="transaction-form" aria-labelledby="editor-heading">
      <div class="form-grid"><label>Date<input type="date" name="date" required value="${today()}" /></label>
      <label>Payee<input name="payee" required maxlength="${MAX_TEXT_LENGTH}" autocomplete="off" placeholder="Where did it go?" /></label>
      <label>Amount<input name="amount" aria-label="Amount" inputmode="decimal" required placeholder="-12.34" /><small>Spending − · income +</small></label>
      <label>Category (optional)<input name="category" maxlength="${MAX_TEXT_LENGTH}" list="category-names" autocomplete="off" /></label>
      <label class="wide-field">Note (optional)<textarea name="note" rows="2" maxlength="${MAX_TEXT_LENGTH}"></textarea></label></div>
      <datalist id="category-names">${context.view.ledger.categories.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("")}</datalist>
      <div class="form-actions"><button type="submit" class="primary">Save transaction</button><button type="button" id="cancel-edit" hidden>Cancel edit</button></div>
    </form></div>
    <div class="panel ledger-panel" data-geo="list"><div class="list-heading"><h3>Your transactions</h3><div><span class="muted" data-testid="shown-count"></span><button type="button" id="export-shown">Export shown</button></div></div><div id="find-controls"></div><div id="transaction-list"></div></div>`;
  attachEditor(section, context);
  requiredElement(section, "#find-controls").append(filtersView(context, () => renderList(section, context)));
  attachExport(section, context);
  renderList(section, context);
  return section;
}

function attachEditor(section: HTMLElement, context: ViewContext): void {
  const form = requiredElement<HTMLFormElement>(section, "#transaction-form");
  form.onsubmit = (event) => {
    event.preventDefault();
    try {
      const original = context.view.ledger.transactions.find((item) => item.id === form.dataset.id);
      const category = preserveText(fieldValue(form, "category"), original?.category ?? undefined, false);
      void context.perform({ type: "transaction.save", ...(form.dataset.id ? { id: form.dataset.id } : {}), transaction: {
        date: fieldValue(form, "date"), payee: preserveText(fieldValue(form, "payee"), original?.payee, false), amount: parseMoney(fieldValue(form, "amount")),
        category: category || null, note: preserveText(fieldValue(form, "note"), original?.note, true),
      } }, "Transaction saved");
    } catch (error) { context.showError(error); }
  };
  requiredElement<HTMLButtonElement>(section, "#cancel-edit").onclick = () => {
    delete form.dataset.id;
    form.reset();
    requiredElement(section, "#editor-heading").textContent = "Add transaction";
    requiredElement<HTMLButtonElement>(section, "#cancel-edit").hidden = true;
  };
}

function renderList(section: HTMLElement, context: ViewContext): number {
  const list = requiredElement<HTMLElement>(section, "#transaction-list");
  const transactions = findTransactions(context.view.ledger.transactions, currentFilter(context.view.ledger));
  requiredElement(section, '[data-testid="shown-count"]').textContent = `${transactions.length} shown · ${context.view.ledger.transactions.length} total`;
  if (!transactions.length) {
    const emptyLedger = !context.view.ledger.transactions.length;
    list.innerHTML = `<div class="empty"><p>${emptyLedger ? "No transactions yet" : "No matching transactions"}</p><span>${emptyLedger ? "Add your first transaction above." : "Adjust or clear your filters."}</span></div>`;
    return 0;
  }
  list.innerHTML = `<div class="table-scroll"><table><caption class="sr-only">Transactions, newest first</caption><thead><tr><th>Date</th><th>Payee / note</th><th>Category</th><th class="money">Amount</th><th>Actions</th></tr></thead><tbody></tbody></table></div>`;
  const body = requiredElement<HTMLTableSectionElement>(list, "tbody");
  for (const transaction of transactions) body.append(transactionRow(transaction, section, context));
  return transactions.length;
}

function attachExport(section: HTMLElement, context: ViewContext): void {
  const button = requiredElement<HTMLButtonElement>(section, "#export-shown");
  button.onclick = () => {
    button.disabled = true;
    void backend.exportCsv(currentFilter(context.view.ledger)).then((receipt) => {
      context.announce(receipt ? `Exported ${receipt.count} transaction${receipt.count === 1 ? "" : "s"} to ${receipt.name}` : "Export cancelled");
    }).catch((error: unknown) => context.showError(error)).finally(() => { button.disabled = false; });
  };
}

function transactionRow(transaction: Transaction, section: HTMLElement, context: ViewContext): HTMLTableRowElement {
  const row = document.createElement("tr");
  row.innerHTML = `<td class="date">${transaction.date}</td><td><strong>${escapeHtml(transaction.payee)}</strong>${transaction.note ? `<small>${escapeHtml(transaction.note)}</small>` : ""}</td><td>${escapeHtml(transaction.category ?? "Uncategorised")}</td><td class="money ${transaction.amount < 0 ? "spending" : "income"}">${formatMoney(transaction.amount, context.view.ledger.currency)}</td><td class="row-actions"><button type="button" aria-label="Edit ${escapeHtml(transaction.payee)}">Edit</button><button type="button" class="danger" aria-label="Delete ${escapeHtml(transaction.payee)}">Delete</button></td>`;
  const [edit, remove] = row.querySelectorAll("button");
  edit.onclick = () => editTransaction(transaction, section);
  remove.onclick = () => { void context.perform({ type: "transaction.delete", id: transaction.id }, "Transaction deleted"); };
  return row;
}

function editTransaction(transaction: Transaction, section: HTMLElement): void {
  const form = requiredElement<HTMLFormElement>(section, "#transaction-form");
  form.dataset.id = transaction.id;
  const fields = { ...transaction, amount: decimalAmount(transaction.amount), category: transaction.category ?? "" };
  for (const name of ["date", "payee", "amount", "category", "note"] as const) {
    requiredElement<HTMLInputElement | HTMLTextAreaElement>(form, `[name="${name}"]`).value = fields[name];
  }
  requiredElement(section, "#editor-heading").textContent = "Edit transaction";
  requiredElement<HTMLButtonElement>(section, "#cancel-edit").hidden = false;
  requiredElement<HTMLInputElement>(form, '[name="payee"]').focus();
}

/** DOM text controls normalize line endings; unchanged imported strings stay exact. */
function preserveText(value: string, original: string | undefined, multiline: boolean): string {
  if (original === undefined) return value;
  const normalized = multiline ? original.replace(/\r\n?/g, "\n") : original.replace(/[\r\n]/g, "");
  return value === normalized ? original : value;
}
