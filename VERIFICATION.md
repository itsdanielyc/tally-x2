# Verification ledger

Append-only. Each row says what was proven, where, and by which run. "Built"
is never rounded up to "tested"; anything not listed here is unverified.

| Date | Level | Claim | Platforms | Evidence |
|---|---|---|---|---|

## Unverified

- Everything: the scaffold has not yet run in CI for this project.

| 2026-11-18 16:43 UTC | L0/L1 contract preparation | Version-zero migration and invalid file/IPC payloads; new schema tests first observed red (wrong GBP/empty state; expected function to throw), restored green | local windows-x64 | npm run lint exit 0; npm run test:unit exit 0, 10 tests; hosted Tier 1 pending |

| 2026-11-18 16:59 UTC | L0-L6 slice 1 local preparation | Integer CRUD, mock/file parity, atomic-save failures, corrupt file refusal, browser CRUD/settings and full Electron restart | local windows-x64 | lint exit 0; unit 25 passed; UI behavior 2 passed; L6 5 passed; red: stub money returned 0 vs -1234, no persisted file, corrupt snapshot resolved, missing native Transactions; dedicated-port mutation red: GBP 0.00 vs -12.34 and missing fractional-cent alert; restored green. Hosted gate pending. |
