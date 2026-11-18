import { backend } from "./api";
import { CURRENCIES, type LedgerCommand, type LedgerView } from "../contracts/ledger";
import { transactionsView } from "./ui/transactions";
import { fieldValue, requiredElement } from "./ui/dom";
import { currencyValue } from "../contracts/primitives";

const root = requiredElement<HTMLElement>(document, "#app");
root.innerHTML = `<main data-geo="main"><header class="topbar" data-geo="title"><div class="brand"><span class="brand-mark" aria-hidden="true">t</span><div><h1>Tally</h1><p>Your money, kept local.</p></div></div><span class="backend-badge" data-testid="backend-badge">${backend.kind}</span></header>
  <nav aria-label="Workspace" data-geo="navigation"><button type="button" aria-current="page">Transactions</button></nav>
  <div class="feedback"><p role="status" id="status">Opening your ledger…</p><p role="alert" id="error" hidden></p></div>
  <div id="content"></div>
  <footer data-geo="settings"><details><summary>Settings</summary><form id="settings-form"><label>Currency<select name="currency" aria-label="Currency">${CURRENCIES.map((currency) => `<option>${currency}</option>`).join("")}</select></label><p class="muted">One currency for this ledger. Changing it relabels amounts without converting them.</p><button type="submit">Save settings</button></form></details><span class="muted" data-testid="platform"></span></footer></main>`;

let current: LedgerView;

/** Errors remain visible and never replace the last successfully loaded ledger. */
function showError(error: unknown): void {
  const message = requiredElement<HTMLElement>(root, "#error");
  message.textContent = error instanceof Error ? error.message : String(error);
  message.hidden = false;
  requiredElement(root, "#status").textContent = "";
}

function render(): void {
  requiredElement<HTMLElement>(root, "#content").replaceChildren(transactionsView({ view: current, perform, showError }));
  requiredElement<HTMLSelectElement>(root, '[name="currency"]').value = current.ledger.currency;
}

/** One action boundary catches failures and refreshes only after durable success. */
async function perform(command: LedgerCommand, message: string): Promise<void> {
  try {
    current = await backend.execute(command);
    render();
    requiredElement<HTMLElement>(root, "#error").hidden = true;
    requiredElement(root, "#status").textContent = message;
  } catch (error) { showError(error); }
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
