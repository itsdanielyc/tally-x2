# Tally testing strategy

<!-- keel:start -->
## Levels and commands

| Level | Tool | Command |
|---|---|---|
| L0 | TypeScript, ESLint size limits, knip | `npm run lint` |
| L1 | Vitest pure domain assertions | `npm run test:unit` |
| L2 | Vitest shared mock/backend contract | `npm run test:unit` |
| L3 | Vitest real temporary files | `npm run test:unit` |
| L4/L5 | Playwright Chromium, labelled mock | `npm run test:ui` |
| L6 | Playwright Electron built app | `npm run build` then `npm run test:e2e` |
| L7 | electron-builder + installer round trips | `npm run package`, `installers` workflow |

Tier 1 is windows-x64, macos-arm64 and linux-x64, exactly as in keel.json.
L0-L3 run on all three to catch filesystem differences; L4-L7 run on all three.
Browser builds are test surfaces only. No bank service or network dependency.

## Critical journeys (planned; evidence is in VERIFICATION.md)

| Journey | Planned proof |
|---|---|
| Add, edit, delete, money validation | L1 `tests/unit/transactions.test.ts`; L4 `tests/ui/transactions.spec.ts` |
| Save and reopen, corrupt file, failed write | L3 `tests/unit/persistence.test.ts`; L6 `tests/e2e/app.spec.ts` |
| Mock/backend parity and invalid payloads | L2 `tests/unit/contract.test.ts` |
| CSV preview, diagnostics, duplicates, atomic import, 2,000 rows | L1 `tests/unit/csv.test.ts`; L3 `tests/unit/import.test.ts`; L4 `tests/ui/import.spec.ts`; L6 `tests/e2e/import.spec.ts` |
| Categories, merge, rules | L1 `tests/unit/categories.test.ts`; L4 `tests/ui/categories.spec.ts` |
| Month boundaries, income/spending and budgets | L1 `tests/unit/summary.test.ts`; L4 `tests/ui/summary.spec.ts` |
| Search/filter/export round trip and one-step undo | L1 `tests/unit/find.test.ts`; L3 `tests/unit/export.test.ts`; L4 `tests/ui/find.spec.ts`; L6 `tests/e2e/export.spec.ts` |

Visual tiers: shared ARIA structure, shared geometry with 8px tolerance, and
runner-captured per-OS pixels with maximum differing ratio 0.002. Home/empty
and populated feature states are checked by `tests/ui/home.spec.ts` and feature
specs. PNG changes come through the snapshots workflow and receive visual review.

## Budgets and policy

Fast suite below three minutes; UI below five minutes/OS; L6 below fifteen;
L7 below twenty-five; whole PR below twenty. Triage with `npm run triage`.
No retries below L6. L6/L7 allow one retry for environment noise. A flaky test
gets a reproducer and issue, never deletion or a wider timeout without a cause.
Every new assertion must be observed red before its green is trusted.
Tests enter through the same domain/service/adapter paths that the app ships.

## Not tested in 0.1.0

L8 distribution/screen-reader checks are advisory and not automated initially:
there are no Tier 3 platforms. Signing and notarization are intentionally absent
per ADR 001. Real power interruption is not simulated; deterministic write-fault
injection covers the pre-rename boundary. Published-asset smoke is post-tag work
and outside this run. These limits must remain explicit in release notes.
<!-- keel:end -->
