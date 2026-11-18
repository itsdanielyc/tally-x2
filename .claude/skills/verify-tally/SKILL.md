---
name: verify-tally
description: How to launch, check, drive and clean up Tally on this machine to prove a behaviour end to end. Use it whenever you need to see the real app do something rather than trust a unit test, before claiming a user-facing change works, or when triaging a real-shell failure.
license: MIT
---

# verify-tally

Read cold, mid-task. Every command below is real for this repository.

## Launch

- Built app for the real-shell suite: `npm run build` writes `out/`; the
  suite launches it through Playwright's Electron launcher. Electron
  downloads its binary on first launch; `node node_modules/electron/install.js`
  fetches it ahead of time (CI does this in its own step).
- Dev loop with hot reload: `npm run dev` (electron-vite); renderer alone
  in a browser: `npm run dev:web` (Vite on port 1420).
- Ready means: the main window titled "Tally" is visible and the backend
  badge reads "native".

## Doctor (read-only)

- `node -v` is 24 or newer; the Electron binary is present
  (`node node_modules/electron/install.js` is a no-op when it is).
- `out/main/main.js` exists and is newer than `electron/` and `src/`.
- Linux without a display: run the suite under `xvfb-run`.
- No other instance is running (`tasklist` / `pgrep -f tally`).

## Drive

- Real shell: `npm run test:e2e` launches `out/` through Playwright and
  checks the badge, the greeting round trip and the console; add journeys
  under `tests/e2e/`.
- Browser against the mock: `npm run test:ui` (chromium); the badge must
  read "mock".
- Stable handles: `data-testid` attributes and ARIA roles, never pixels.

## Evidence

- A screenshot from the real shell lands in `artifacts/e2e/<os>-<arch>.png`.
- A behaviour counts as verified when a test asserts it and the ledger row
  names the level, the platform and the run.
- Never weaken a journey to make it pass.

## Cleanup

- Kill only what you started (the suite does this; after a manual launch,
  close the window or kill the one PID you recorded).
- Evidence (`artifacts/`) survives cleanup and is gitignored.

<!-- keel:start -->
## Tally journeys (supersedes the scaffold greeting sample)

`npm run build` then `npm run test:e2e` drives the native bridge, sandbox,
platform, transaction restart, native CSV preview/import, multiline-note edit,
filtered export and exact import into an empty ledger. Fixtures and test data
live under this worktree's `artifacts/`; helpers close the instances they start.

The browser suite owns strict port 21427 and never reuses another server.
`npm run test:ui` checks the labelled mock. Home and five populated states use
shared ARIA, 8px geometry and runner-captured per-OS pixels. Refresh local ARIA
and geometry only with `UPDATE_SNAPSHOTS=1` and a tier-1/tier-2 grep; PNGs must
come from the snapshots workflow.

`TALLY_DATA_DIR` isolates the ledger. Unpackaged native-dialog tests use
`TALLY_IMPORT_PATH` and `TALLY_EXPORT_PATH`; no driver or fixtures ship in the
binary. The L7 external driver runs installed binaries, verifies isPackaged,
opens a saved file, writes, restarts and screenshots before uninstalling.
These environment paths are fixture overrides, not product settings.

Version: `npm run check:version`. Final pre-tag proof:
`npm run check:release -- <tested-candidate-sha>`. Never create a tag/release
without a later user instruction. No cleanup may touch another app or a path
outside this worktree during this task.
<!-- keel:end -->
