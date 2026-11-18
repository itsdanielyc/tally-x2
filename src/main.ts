import { backend } from "./api";

// A backend call that fails must be seen: the real-shell suite fails on any
// console error, so a rejected call cannot pass unnoticed.
function reportError(error: unknown): void {
  console.error(error);
}

window.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector<HTMLInputElement>("#greet-input");
  const msg = document.querySelector<HTMLElement>("#greet-msg");
  const badge = document.querySelector<HTMLElement>("#backend-badge");

  if (badge) {
    badge.textContent = backend.kind === "native" ? "native" : "mock";
    badge.dataset.kind = backend.kind;
  }

  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!input || !msg) return;
    backend
      .greet(input.value)
      .then((text) => {
        msg.textContent = text;
      })
      .catch(reportError);
  });

  document.querySelector("#clear-btn")?.addEventListener("click", () => {
    if (msg) msg.textContent = "";
  });

  backend
    .platformInfo()
    .then((info) => {
      const el = document.querySelector<HTMLElement>("#platform");
      if (el) el.textContent = `${info.os} / ${info.arch}`;
    })
    .catch(reportError);
});
