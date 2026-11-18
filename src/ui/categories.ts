import { escapeHtml, fieldValue, requiredElement } from "./dom";
import { rulesView } from "./rules";
import type { ViewContext } from "./context";

/** Category management stays separate from the transaction entry workflow. */
export function categoriesView(context: ViewContext): HTMLElement {
  const section = document.createElement("section");
  section.innerHTML = `<div class="section-heading"><div><p class="eyebrow">MAKE IT YOURS</p><h2>Categories and rules</h2></div></div>
    <div class="panel"><h3>Categories</h3><form id="category-form" class="inline-form"><label>New category<input name="name" required maxlength="10000" /></label><button type="submit" class="primary">Create category</button></form>
    <p class="muted">Deleting a category leaves its transactions uncategorised and removes its rules and budgets. Merging combines category budgets.</p><ul class="category-list" id="category-list"></ul></div>`;
  const form = requiredElement<HTMLFormElement>(section, "#category-form");
  form.onsubmit = (event) => { event.preventDefault(); void context.perform({ type: "category.create", name: fieldValue(form, "name") }, "Category created"); };
  const list = requiredElement<HTMLUListElement>(section, "#category-list");
  for (const name of context.view.ledger.categories) list.append(categoryRow(name, context));
  section.append(rulesView(context));
  return section;
}

function categoryRow(name: string, context: ViewContext): HTMLLIElement {
  const item = document.createElement("li");
  const targets = context.view.ledger.categories.filter((target) => target !== name);
  item.innerHTML = `<strong>${escapeHtml(name)}</strong><form class="rename-form"><input name="to" aria-label="Rename ${escapeHtml(name)} to" value="${escapeHtml(name)}" required /><button type="submit" aria-label="Rename ${escapeHtml(name)}">Rename</button></form>
    <form class="merge-form"><select name="target" aria-label="Merge ${escapeHtml(name)} into" ${targets.length ? "" : "disabled"}>${targets.map((target) => `<option value="${escapeHtml(target)}">${escapeHtml(target)}</option>`).join("")}</select><button type="submit" aria-label="Merge ${escapeHtml(name)}" ${targets.length ? "" : "disabled"}>Merge</button></form>
    <button type="button" class="danger" aria-label="Delete category ${escapeHtml(name)}">Delete</button>`;
  const rename = requiredElement<HTMLFormElement>(item, ".rename-form");
  rename.onsubmit = (event) => { event.preventDefault(); void context.perform({ type: "category.rename", name, to: fieldValue(rename, "to") }, "Category renamed"); };
  const merge = requiredElement<HTMLFormElement>(item, ".merge-form");
  merge.onsubmit = (event) => { event.preventDefault(); void context.perform({ type: "category.merge", source: name, target: fieldValue(merge, "target") }, "Categories merged"); };
  requiredElement<HTMLButtonElement>(item, ".danger").onclick = () => { void context.perform({ type: "category.delete", name }, "Category deleted; transactions kept"); };
  return item;
}
