import { summarizeMonth, shiftMonth, type CategorySummary, type MonthlySummary } from "../../domain/summary";
import { decimalAmount, formatMoney, parseMoney } from "../../domain/money";
import { calendarDate } from "../../contracts/primitives";
import { escapeHtml, fieldValue, requiredElement, today } from "./dom";
import type { ViewContext } from "./context";

let selectedMonth = today().slice(0, 7);

/** Month navigation updates only the summary body, preserving keyboard focus. */
export function summaryView(context: ViewContext): HTMLElement {
  const section = document.createElement("section");
  section.innerHTML = `<div class="section-heading"><div><p class="eyebrow">THE MONTH AT A GLANCE</p><h2>Monthly summary</h2></div></div>
    <div class="month-controls" data-geo="month-nav"><button type="button" id="previous-month">Previous month</button><label>Month<input type="month" id="month" min="0001-01" max="9999-12" value="${selectedMonth}" /></label><button type="button" id="next-month">Next month</button></div><div id="month-details"></div>`;
  const input = requiredElement<HTMLInputElement>(section, "#month");
  const changeMonth = (month: string): void => {
    calendarDate(`${month}-01`);
    selectedMonth = month;
    input.value = month;
    renderMonth(section, context);
  };
  input.onchange = () => { try { changeMonth(input.value); } catch (error) { context.showError(error); } };
  requiredElement<HTMLButtonElement>(section, "#previous-month").onclick = () => changeMonth(shiftMonth(selectedMonth, -1));
  requiredElement<HTMLButtonElement>(section, "#next-month").onclick = () => changeMonth(shiftMonth(selectedMonth, 1));
  renderMonth(section, context);
  return section;
}

function metrics(summary: MonthlySummary, currency: string): string {
  const values = [{ label: "Income", key: "income", amount: summary.income },
    { label: "Spending", key: "spending", amount: summary.spending }, { label: "Net", key: "net", amount: summary.net }];
  return `<div class="metric-grid" data-geo="summary-metrics">${values.map((metric) => `<div class="panel metric"><h3>${metric.label}</h3><strong data-testid="summary-${metric.key}">${formatMoney(metric.amount, currency)}</strong></div>`).join("")}</div>`;
}

function renderMonth(section: HTMLElement, context: ViewContext): void {
  const summary = summarizeMonth(context.view.ledger, selectedMonth);
  const details = requiredElement<HTMLElement>(section, "#month-details");
  details.innerHTML = `${metrics(summary, context.view.ledger.currency)}<div class="panel" data-geo="summary-categories"><h3>Category totals</h3><p class="muted">${summary.transactionCount} transactions this month. Budgets compare gross spending; positive amounts are income.</p>
    <div class="table-scroll"><table><caption class="sr-only">Category totals for ${selectedMonth}</caption><thead><tr><th>Category</th><th class="money">Income</th><th class="money">Spending</th><th class="money">Net</th><th>Monthly budget</th><th class="money">Left / over</th></tr></thead><tbody></tbody></table></div>
    ${summary.categories.length ? "" : '<p class="empty">No transactions this month. Create categories to set budgets.</p>'}</div>`;
  const body = requiredElement<HTMLTableSectionElement>(details, "tbody");
  for (const category of summary.categories) body.append(categoryRow(category, context));
  requiredElement<HTMLButtonElement>(section, "#previous-month").disabled = selectedMonth === "0001-01";
  requiredElement<HTMLButtonElement>(section, "#next-month").disabled = selectedMonth === "9999-12";
}

function categoryRow(summary: CategorySummary, context: ViewContext): HTMLTableRowElement {
  const row = document.createElement("tr");
  const currency = context.view.ledger.currency;
  const remaining = summary.remaining === null ? "Not set" : `${formatMoney(summary.remaining < 0n ? -summary.remaining : summary.remaining, currency)} ${summary.remaining < 0n ? "over" : "left"}`;
  row.innerHTML = `<td><strong>${escapeHtml(summary.category ?? "Uncategorised")}</strong></td><td class="money">${formatMoney(summary.income, currency)}</td><td class="money">${formatMoney(summary.spending, currency)}</td><td class="money">${formatMoney(summary.net, currency)}</td><td class="budget-cell"></td><td class="money ${summary.remaining !== null && summary.remaining < 0n ? "over-budget" : "income"}">${remaining}</td>`;
  if (summary.category === null) { requiredElement(row, ".budget-cell").textContent = "—"; return row; }
  const category = summary.category;
  const form = document.createElement("form");
  form.className = "budget-form";
  form.innerHTML = `<input name="amount" inputmode="decimal" aria-label="Budget for ${escapeHtml(category)}" placeholder="Not set" value="${summary.budget === null ? "" : decimalAmount(summary.budget)}" /><button type="submit" aria-label="Save budget ${escapeHtml(category)}">Save</button>`;
  form.onsubmit = (event) => {
    event.preventDefault();
    try {
      const text = fieldValue(form, "amount");
      void context.perform({ type: "budget.save", category, month: selectedMonth, amount: text.trim() ? parseMoney(text) : null }, "Monthly budget saved");
    } catch (error) { context.showError(error); }
  };
  requiredElement(row, ".budget-cell").append(form);
  return row;
}
