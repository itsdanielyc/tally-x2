import { escapeHtml, fieldValue, requiredElement } from "./dom";
import type { ViewContext } from "./context";

/** Ordered, visible rules share the same category names as the ledger. */
export function rulesView(context: ViewContext): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "panel";
  const { categories, rules } = context.view.ledger;
  panel.innerHTML = `<h3>Payee rules</h3><p class="muted">The first matching rule wins, ignoring letter case. Explicit categories are kept. Imports use these rules automatically.</p>
    <form id="rule-form"><div class="form-grid"><label class="span-two">Payee contains<input name="contains" required maxlength="10000" /></label>
    <label>Rule category<select name="category" aria-label="Rule category" required>${categories.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}</select></label></div>
    <div class="form-actions"><button type="submit" class="primary" ${categories.length ? "" : "disabled"}>Save rule</button><button id="cancel-rule" type="button" hidden>Cancel rule edit</button></div></form>
    ${categories.length ? "" : '<p class="muted">Create a category first.</p>'}<ul class="management-list" id="rule-list"></ul>
    <button type="button" id="apply-rules" ${rules.length ? "" : "disabled"}>Apply rules to uncategorised</button>`;
  const form = requiredElement<HTMLFormElement>(panel, "form");
  form.onsubmit = (event) => {
    event.preventDefault();
    void context.perform({ type: "rule.save", ...(form.dataset.id ? { id: form.dataset.id } : {}), contains: fieldValue(form, "contains"), category: fieldValue(form, "category") }, "Rule saved");
  };
  requiredElement<HTMLButtonElement>(panel, "#cancel-rule").onclick = () => {
    delete form.dataset.id; form.reset(); requiredElement<HTMLButtonElement>(panel, "#cancel-rule").hidden = true;
  };
  const list = requiredElement<HTMLUListElement>(panel, "#rule-list");
  for (const rule of rules) {
    const item = document.createElement("li");
    item.innerHTML = `<span>Payee contains “${escapeHtml(rule.contains)}” → <strong>${escapeHtml(rule.category)}</strong></span><div class="row-actions"><button type="button" aria-label="Edit rule ${escapeHtml(rule.contains)}">Edit</button><button type="button" class="danger" aria-label="Delete rule ${escapeHtml(rule.contains)}">Delete</button></div>`;
    const [edit, remove] = item.querySelectorAll("button");
    edit.onclick = () => {
      form.dataset.id = rule.id;
      requiredElement<HTMLInputElement>(form, '[name="contains"]').value = rule.contains;
      requiredElement<HTMLSelectElement>(form, '[name="category"]').value = rule.category;
      requiredElement<HTMLButtonElement>(panel, "#cancel-rule").hidden = false;
      requiredElement<HTMLInputElement>(form, '[name="contains"]').focus();
    };
    remove.onclick = () => { void context.perform({ type: "rule.delete", id: rule.id }, "Rule deleted"); };
    list.append(item);
  }
  requiredElement<HTMLButtonElement>(panel, "#apply-rules").onclick = () => { void context.perform({ type: "rule.apply" }, "Rules applied to uncategorised transactions"); };
  return panel;
}
