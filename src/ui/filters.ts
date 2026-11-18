import { defaultFilter, validateFilter, type TransactionFilter } from "../../contracts/find";
import type { Ledger } from "../../contracts/ledger";
import { decimalAmount, parseMoney } from "../../domain/money";
import { escapeHtml, fieldValue, requiredElement } from "./dom";
import type { ViewContext } from "./context";

let activeFilter = defaultFilter();
let panelOpen = false;

/** Queries survive list refreshes but never become persisted ledger state. */
export function currentFilter(ledger: Ledger): TransactionFilter {
  if (typeof activeFilter.category === "string" && !ledger.categories.includes(activeFilter.category)) activeFilter = { ...activeFilter, category: undefined };
  return { ...activeFilter };
}

function optionalMoney(text: string): number | null { return text.trim() ? parseMoney(text) : null; }
function categoryValue(value: string, categories: string[]): string | null | undefined {
  if (value === "all") return undefined;
  if (value === "uncategorised") return null;
  const category = categories[Number(value)];
  if (category === undefined) throw new Error("Invalid category filter");
  return category;
}

/** The editor stays mounted while only list results update, preserving typed text. */
export function filtersView(context: ViewContext, updateList: () => number): HTMLDetailsElement {
  const filter = currentFilter(context.view.ledger);
  const details = document.createElement("details");
  details.className = "find-panel";
  details.dataset.geo = "filters";
  details.open = panelOpen;
  const selectedCategory = filter.category === undefined ? "all" : filter.category === null ? "uncategorised" : String(context.view.ledger.categories.indexOf(filter.category));
  details.innerHTML = `<summary>Find transactions</summary><form id="filter-form"><div class="form-grid mapping-grid">
    <label class="span-two">Search payee or note<input name="search" value="${escapeHtml(filter.search)}" /></label>
    <label>Filter category<select name="category" aria-label="Filter category"><option value="all">All categories</option><option value="uncategorised">Uncategorised</option>${context.view.ledger.categories.map((name, index) => `<option value="${index}">${escapeHtml(name)}</option>`).join("")}</select></label>
    <label>From date<input type="date" name="from" value="${filter.dateFrom ?? ""}" /></label><label>To date<input type="date" name="to" value="${filter.dateTo ?? ""}" /></label>
    <label>Minimum amount<input name="minimum" inputmode="decimal" value="${filter.minimumAmount === null ? "" : decimalAmount(filter.minimumAmount)}" /></label>
    <label>Maximum amount<input name="maximum" inputmode="decimal" value="${filter.maximumAmount === null ? "" : decimalAmount(filter.maximumAmount)}" /></label></div>
    <div class="form-actions"><button type="submit">Apply filters</button><button type="button" id="clear-filters">Clear filters</button></div></form>`;
  const form = requiredElement<HTMLFormElement>(details, "form");
  requiredElement<HTMLSelectElement>(form, '[name="category"]').value = selectedCategory;
  details.ontoggle = () => { panelOpen = details.open; };
  form.onsubmit = (event) => {
    event.preventDefault();
    try {
      activeFilter = validateFilter({ search: fieldValue(form, "search"), category: categoryValue(fieldValue(form, "category"), context.view.ledger.categories),
        dateFrom: fieldValue(form, "from"), dateTo: fieldValue(form, "to"), minimumAmount: optionalMoney(fieldValue(form, "minimum")), maximumAmount: optionalMoney(fieldValue(form, "maximum")) });
      context.announce(`Showing ${updateList()} transactions`);
    } catch (error) { context.showError(error); }
  };
  requiredElement<HTMLButtonElement>(details, "#clear-filters").onclick = () => {
    activeFilter = defaultFilter();
    const replacement = filtersView(context, updateList);
    details.replaceWith(replacement);
    updateList();
    requiredElement<HTMLInputElement>(replacement, '[name="search"]').focus();
    context.announce("Filters cleared");
  };
  return details;
}
