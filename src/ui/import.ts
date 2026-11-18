import { backend } from "../api";
import { csvFile, csvMapping, type CsvFile, type CsvMapping } from "../../contracts/csv";
import { inspectCsv, previewCsv, type CsvInspection, type ImportPreview } from "../../domain/csv";
import { formatMoney } from "../../domain/money";
import { escapeHtml, fieldValue, requiredElement } from "./dom";
import type { ViewContext } from "./context";

const PREVIEW_ROW_LIMIT = 8;
type ColumnName = "date" | "payee" | "amount" | "debit" | "credit" | "category" | "note";
const COLUMN_LABELS: Record<ColumnName, string> = { date: "Date column", payee: "Payee column", amount: "Signed amount column", debit: "Debit column", credit: "Credit column", category: "Category column", note: "Note column" };

/** Keep file selection and mapping ephemeral until one explicit confirmation. */
export function importView(context: ViewContext): HTMLElement {
  const section = document.createElement("section");
  section.innerHTML = `<div class="section-heading"><div><p class="eyebrow">BRING YOUR RECORDS</p><h2>Import a bank CSV</h2></div></div>
    <div class="panel" data-geo="import-file"><h3>Choose a file</h3><p class="muted">Map the columns, check the preview, then import accepted rows together. Duplicate rows are skipped.</p><button type="button" id="choose-csv">Choose CSV</button><input type="file" accept=".csv,.txt,text/csv" id="csv-input" hidden /></div><div id="import-work"></div>`;
  const input = requiredElement<HTMLInputElement>(section, "#csv-input");
  const prepare = (file: CsvFile): void => {
    const selected = csvFile(file);
    const inspection = inspectCsv(selected.content);
    if (!inspection.headers.length) throw new Error("CSV has no tabular header");
    renderMapping(section, context, selected, inspection);
  };
  requiredElement<HTMLButtonElement>(section, "#choose-csv").onclick = () => {
    if (backend.kind === "mock") { input.click(); return; }
    void backend.pickCsv().then((file) => { if (file) prepare(file); }).catch((error: unknown) => context.showError(error));
  };
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    void file.arrayBuffer().then((bytes) => prepare({ name: file.name, content: new TextDecoder("utf-8", { fatal: true }).decode(bytes) })).catch((error: unknown) => context.showError(error));
  };
  return section;
}

function columnSelect(key: ColumnName, inspection: CsvInspection): string {
  const selected = inspection.mapping[key];
  const options = inspection.headers.map((header, index) => `<option value="${index}" ${selected === index ? "selected" : ""}>${index + 1} · ${escapeHtml(header)}</option>`).join("");
  return `<label>${COLUMN_LABELS[key]}<select name="${key}" aria-label="${COLUMN_LABELS[key]}"><option value="" ${selected === null ? "selected" : ""}>Unmapped</option>${options}</select></label>`;
}

function renderMapping(section: HTMLElement, context: ViewContext, file: CsvFile, inspection: CsvInspection): void {
  const work = requiredElement<HTMLElement>(section, "#import-work");
  work.innerHTML = `<div class="panel" data-geo="import-mapping"><h3>${escapeHtml(file.name)}</h3><p class="muted">Detected ${inspection.delimiter === "\t" ? "tab" : escapeHtml(inspection.delimiter)} delimiter · header line ${inspection.headerLine}</p>
    <form id="mapping-form"><label class="header-choice">Header line<select name="headerRow" aria-label="Header line">${inspection.headerCandidates.map((candidate) => `<option value="${candidate.index}" ${candidate.index === inspection.headerRow ? "selected" : ""}>Line ${candidate.line}: ${escapeHtml(candidate.label)}</option>`).join("")}</select></label><div class="form-grid mapping-grid">
    ${(Object.keys(COLUMN_LABELS) as ColumnName[]).map((name) => columnSelect(name, inspection)).join("")}
    <label>Date order<select name="dateOrder" aria-label="Date order"><option value="DMY">Day / month / year</option><option value="MDY">Month / day / year</option><option value="YMD">Year / month / day</option></select></label>
    <label>Decimal separator<select name="decimalSeparator" aria-label="Decimal separator"><option value=".">Dot (12.34)</option><option value=",">Comma (12,34)</option></select></label></div>
    <p class="muted">Choose a signed amount column, or leave it unmapped and choose both debit and credit columns.</p><div class="form-actions"><button class="primary" type="submit">Preview import</button><button type="button" id="cancel-import">Cancel import</button></div></form></div><div id="import-preview"></div>`;
  const form = requiredElement<HTMLFormElement>(work, "form");
  requiredElement<HTMLSelectElement>(form, '[name="headerRow"]').onchange = (event) => {
    try { renderMapping(section, context, file, inspectCsv(file.content, Number((event.currentTarget as HTMLSelectElement).value))); }
    catch (error) { context.showError(error); }
  };
  requiredElement<HTMLSelectElement>(form, '[name="dateOrder"]').value = inspection.mapping.dateOrder;
  requiredElement<HTMLSelectElement>(form, '[name="decimalSeparator"]').value = inspection.mapping.decimalSeparator;
  form.onchange = () => requiredElement(work, "#import-preview").replaceChildren();
  form.onsubmit = (event) => {
    event.preventDefault();
    try {
      const mapping = mappingFromForm(form, inspection.mapping.tallyId);
      renderPreview(work, context, file, mapping, previewCsv(context.view.ledger, file.content, mapping));
    } catch (error) { context.showError(error); }
  };
  requiredElement<HTMLButtonElement>(work, "#cancel-import").onclick = () => {
    work.replaceChildren();
    requiredElement<HTMLInputElement>(section, "#csv-input").value = "";
  };
}

function mappingFromForm(form: HTMLFormElement, tallyId: number | null | undefined): CsvMapping {
  const column = (name: string): number | null => { const value = fieldValue(form, name); return value === "" ? null : Number(value); };
  return csvMapping({ ...(tallyId === undefined ? {} : { tallyId }), headerRow: Number(fieldValue(form, "headerRow")), date: column("date"), payee: column("payee"),
    amount: column("amount"), debit: column("debit"), credit: column("credit"), category: column("category"), note: column("note"),
    dateOrder: fieldValue(form, "dateOrder"), decimalSeparator: fieldValue(form, "decimalSeparator") });
}

function renderPreview(work: HTMLElement, context: ViewContext, file: CsvFile, mapping: CsvMapping, preview: ImportPreview): void {
  const region = requiredElement<HTMLElement>(work, "#import-preview");
  const rows = preview.accepted.slice(0, PREVIEW_ROW_LIMIT).map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.payee)}</td><td>${escapeHtml(item.category ?? "Uncategorised")}</td><td class="money">${formatMoney(item.amount, context.view.ledger.currency)}</td></tr>`).join("");
  region.innerHTML = `<div class="panel" data-geo="import-preview"><h3>Preview</h3><p data-testid="import-counts">${preview.accepted.length} accepted · ${preview.duplicates} duplicates skipped · ${preview.errors.length} rejected</p>
    <div class="table-scroll"><table><caption class="sr-only">First accepted rows</caption><thead><tr><th>Date</th><th>Payee</th><th>Category</th><th class="money">Amount</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${preview.errors.length ? `<h3 class="diagnostic-title">Rejected rows</h3><ul class="diagnostics" aria-label="Rejected rows">${preview.errors.map((error) => `<li>Line ${error.line}: ${escapeHtml(error.reason)}</li>`).join("")}</ul>` : ""}
    <p class="muted">All ${preview.accepted.length} accepted rows will be saved together. Rejected rows are excluded.</p><button type="button" class="primary" id="confirm-import" ${preview.accepted.length ? "" : "disabled"}>Confirm import</button></div>`;
  const button = requiredElement<HTMLButtonElement>(region, "#confirm-import");
  button.onclick = () => {
    button.disabled = true;
    void context.perform({ type: "csv.import", file, mapping }, `Imported ${preview.accepted.length} transaction${preview.accepted.length === 1 ? "" : "s"}; skipped ${preview.duplicates} duplicates`).finally(() => { button.disabled = false; });
  };
}
