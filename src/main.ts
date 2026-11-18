import { backend } from "./api";
import { CURRENCIES, type LedgerCommand, type LedgerView } from "../contracts/ledger";
import { transactionsView } from "./ui/transactions";
import { importView } from "./ui/import";
import { categoriesView } from "./ui/categories";
import { summaryView } from "./ui/summary";
import { fieldValue, requiredElement } from "./ui/dom";
import { currencyValue } from "../contracts/primitives";

const WORKSPACE_VIEWS = {
  transactions: { label: "Transactions", render: transactionsView },
  import: { label: "Import CSV", render: importView },
  categories: { label: "Categories", render: categoriesView },
  summary: { label: "Monthly summary", render: summaryView },
};
type WorkspaceRoute = keyof typeof WORKSPACE_VIEWS;

const root = requiredElement<HTMLElement>(document, "#app");
root.innerHTML = `<main data-geo="main"><header class="topbar" data-geo="title"><div class="brand"><span class="brand-mark" aria-hidden="true">t</span><div><h1>Tally</h1><p>Your money, kept local.</p></div></div><span class="backend-badge" data-testid="backend-badge">${backend.kind}</span></header>
  <nav aria-label="Workspace" data-geo="navigation">${Object.entries(WORKSPACE_VIEWS).map(([route, view]) => `<button type="button" data-route="${route}" ${route === "transactions" ? 'aria-current="page"' : ""}>${view.label}</button>`).join("")}</nav>
  <div class="feedback"><p role="status" id="status">Opening your ledger…</p><p role="alert" id="error" hidden></p></div>
  <div id="content"></div>
  <footer data-geo="settings"><details><summary>Settings</summary><form id="settings-form"><label>Currency<select name="currency" aria-label="Currency">${CURRENCIES.map((currency) => `<option>${currency}</option>`).join("")}</select></label><p class="muted">One currency for this ledger. Changing it relabels amounts without converting them.</p><button type="submit">Save settings</button></form></details><span class="muted" data-testid="platform"></span></footer></main>`;

let current: LedgerView;
let route: WorkspaceRoute = "transactions";
let mutationPending = false;
type InteractiveControl = HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement;

/** Errors remain visible and never replace the last successfully loaded ledger. */
function showError(error: unknown): void {
  const message = requiredElement<HTMLElement>(root, "#error");
  message.textContent = error instanceof Error ? error.message : String(error);
  message.hidden = false;
  requiredElement(root, "#status").textContent = "";
}

function render(): void {
  if (!current) return;
  const context = { view: current, perform, showError };
  requiredElement<HTMLElement>(root, "#content").replaceChildren(WORKSPACE_VIEWS[route].render(context));
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-route]")) {
    if (button.dataset.route === route) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  requiredElement<HTMLSelectElement>(root, '[name="currency"]').value = current.ledger.currency;
}

for (const button of root.querySelectorAll<HTMLButtonElement>("[data-route]")) {
  button.onclick = () => {
    const selected = button.dataset.route;
    if (selected && selected in WORKSPACE_VIEWS) { route = selected as WorkspaceRoute; render(); }
  };
}

/** One action boundary catches failures and refreshes only after durable success. */
async function perform(command: LedgerCommand, message: string): Promise<void> {
  if (mutationPending) return;
  mutationPending = true;
  const controls = [...root.querySelectorAll<InteractiveControl>("input, button, select, textarea")].filter((control) => !control.disabled);
  for (const control of controls) control.disabled = true;
  root.setAttribute("aria-busy", "true");
  try {
    current = await backend.execute(command);
    render();
    requiredElement<HTMLElement>(root, "#error").hidden = true;
    requiredElement(root, "#status").textContent = message;
  } catch (error) { showError(error); }
  finally {
    mutationPending = false;
    for (const control of controls) if (control.isConnected) control.disabled = false;
    root.setAttribute("aria-busy", "false");
  }
}

requiredElement<HTMLFormElement>(root, "#settings-form").onsubmit = (event) => {
  event.preventDefault();
  try {
    const currency = currencyValue(fieldValue(event.currentTarget as HTMLFormElement, "currency"));
    void perform({ type: "settings.currency", currency }, "Currency saved");
  } catch (error) { showError(error); }
};

async function openLedger(): Promise<void> {
  try {
    current = await backend.snapshot();
    render();
    requiredElement(root, "#status").textContent = "All changes saved on this device";
    const platform = await backend.platformInfo();
    requiredElement(root, '[data-testid="platform"]').textContent = `${platform.os} / ${platform.arch}`;
  } catch (error) { showError(error); }
}

void openLedger();
