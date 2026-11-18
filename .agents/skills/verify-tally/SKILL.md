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
