/** Escape all user text before inserting it into an HTML template. */
export function escapeHtml(value: string): string {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

/** Fail fast on a broken view contract instead of silently losing controls. */
export function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

/** Native local date; UTC conversion would move dates near midnight. */
export function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Retrieve a named field with the same validation for every form. */
export function fieldValue(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  if (typeof value !== "string") throw new Error(`Missing form field: ${name}`);
  return value;
}
