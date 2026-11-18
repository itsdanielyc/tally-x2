# Verification ledger

Append-only. Each row says what was proven, where, and by which run. "Built"
is never rounded up to "tested"; anything not listed here is unverified.

| Date | Level | Claim | Platforms | Evidence |
|---|---|---|---|---|

## Unverified

- Everything: the scaffold has not yet run in CI for this project.

| 2026-11-18 16:43 UTC | L0/L1 contract preparation | Version-zero migration and invalid file/IPC payloads; new schema tests first observed red (wrong GBP/empty state; expected function to throw), restored green | local windows-x64 | npm run lint exit 0; npm run test:unit exit 0, 10 tests; hosted Tier 1 pending |
| 2026-11-18 17:18 UTC | L0/L1 scaffold harness repair | Snapshot artifacts cannot overwrite another OS with stale pixels | local windows-x64 | snapshot-artifacts.test.ts observed red with unwanted darwin/win32 PNGs, then green; lint and unit exit 0. Actual captured PNGs reviewed for all three systems. |
