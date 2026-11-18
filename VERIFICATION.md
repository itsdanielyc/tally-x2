# Verification ledger

Append-only. Each row says what was proven, where, and by which run. "Built"
is never rounded up to "tested"; anything not listed here is unverified.

| Date | Level | Claim | Platforms | Evidence |
|---|---|---|---|---|

## Unverified

- Everything: the scaffold has not yet run in CI for this project.

| 2026-11-18 16:43 UTC | L0/L1 contract preparation | Version-zero migration and invalid file/IPC payloads; new schema tests first observed red (wrong GBP/empty state; expected function to throw), restored green | local windows-x64 | npm run lint exit 0; npm run test:unit exit 0, 10 tests; hosted Tier 1 pending |

| 2026-11-18 16:59 UTC | L0-L6 slice 1 local preparation | Integer CRUD, mock/file parity, atomic-save failures, corrupt file refusal, browser CRUD/settings and full Electron restart | local windows-x64 | lint exit 0; unit 25 passed; UI behavior 2 passed; L6 5 passed; red: stub money returned 0 vs -1234, no persisted file, corrupt snapshot resolved, missing native Transactions; dedicated-port mutation red: GBP 0.00 vs -12.34 and missing fractional-cent alert; restored green. Hosted gate pending. |

| 2026-11-18 17:06 UTC | L0/L1 CSV contract preparation | Bounded import payloads, mapping indexes and date/decimal options | local windows-x64 | lint exit 0; unit 27 passed; red: Unknown ledger command and invalid mapping failed to throw; then green. Hosted evidence pending. |

| 2026-11-18 17:16 UTC | L0-L6 CSV local preparation | Mapping/preview/diagnostics, exact duplicate detection, atomic accepted-row import, native file selection and 2,000-row budget | local windows-x64 | lint exit 0; unit 36 passed including real-file import under 5s; browser 3 passed; L6 6 passed. Red: wrong delimiter/header, missing accepted rows, Unknown ledger command, no native Import CSV control; parity mutant expected 2 got 0; duplicate mutant reimport accepted 1 instead of 0. Hosted gate and refreshed pixels pending. |
| 2026-11-18 17:18 UTC | L0/L1 scaffold harness repair | Snapshot artifacts cannot overwrite another OS with stale pixels | local windows-x64 | snapshot-artifacts.test.ts observed red with unwanted darwin/win32 PNGs, then green; lint and unit exit 0. Actual captured PNGs reviewed for all three systems. |

| 2026-11-18 17:25 UTC | L0/L1 category contract preparation | Category and rule command shapes reject empty names and matches | local windows-x64 | lint exit 0; unit 39 passed; red: new commands unknown; blank-name bypass mutant failed to throw; restored green. |

| 2026-11-18 17:32 UTC | L0-L5 category local preparation | Category reference integrity, rule priority, import-preview parity, explicit categorisation and UI management | local windows-x64 | lint exit 0; unit 43 passed; 5 browser journeys passed; red: Unknown ledger command, missing Categories control, preview category null vs Food; all restored green. Categories UI image reviewed. Hosted L5 pending. |

| 2026-11-18 17:35 UTC | L0/L1 budget contract preparation | Validated calendar months, nonnegative integer budgets, zero and removal | local windows-x64 | lint and unit exit 0; positive budget command first observed red as Unknown ledger command. |
