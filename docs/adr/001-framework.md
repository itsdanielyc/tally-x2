# ADR 001: Framework

Status: accepted · Date: 2026-11-18 · Decided by: the owner, before planning

## Context

From PRODUCT.md: a desktop app for Windows, macOS and Linux with one UI, a
local file as the only storage, no network use, and file dialogs for CSV
import and export. The UI must look the same on the three systems, and the
builders are strongest in TypeScript.

## Decision

Electron with a TypeScript UI built by Vite. Profile `electron-web`.

## Rejected

- Tauri: smaller, but three webviews make per-OS rendering differ, and the
  product has no need to be small or always running.
- Avalonia and Flutter: no DOM, so no structure or geometry tiers, and no
  proven Keel template.

## Consequences

- Testing: browser UI tests against the labelled mock (L4/L5, Playwright on
  chromium, three OS runners); a real-shell suite (L6, Playwright Electron);
  installer tests (L7, electron-builder bundles).
- The main process owns the ledger file and file dialogs. The renderer is
  sandboxed and reaches them only through the typed preload bridge.
- Packaging: electron-builder, unsigned for 0.1.0.
