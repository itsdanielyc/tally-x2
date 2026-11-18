# Tally architecture

<!-- keel:start -->
## Module map

| Module | Responsibility | May call | Must not know |
|---|---|---|---|
| `src/` | Accessible desktop presentation | `src/api.ts`, shared types, pure selectors | Filesystem, Electron IPC |
| `contracts/` | Typed ledger commands and validated data shapes | Pure validation helpers | DOM, filesystem, Electron |
| `domain/` | Ledger transformations and monetary/CSV calculations | Contracts, other domain functions | DOM, IPC, filesystem |
| `backend/` | Serialize commands against durable ledger state | Domain, injected persistence and dialogs | DOM, Electron window |
| `electron/` | OS integration and sandboxed transport | Backend, contracts, Electron | Presentation logic |
| `persistence/` | Versioned crash-safe ledger file | Contracts, Node filesystem | UI, dialogs, IPC |

## Seam

The sandboxed renderer calls a single typed `LedgerApi` through `src/api.ts`.
The preload exposes only named operations; main validates every incoming payload.
The labelled browser mock implements the same interface using the same domain
operations with in-memory persistence. L2 runs shared calls against mock and
the backend service with a real temporary ledger, comparing data and errors.
Contract extensions land in their own small PR before feature implementation.

## State and data

One versioned UTF-8 JSON document in Electron's userData directory contains
currency, transactions, categories, payee rules and category/month budgets.
Amounts are safe integer minor units; parsing decimal strings uses integer
arithmetic. Default currency is GBP; settings choose one currency without
conversion. Dates are validated calendar dates (`YYYY-MM-DD`), never timestamps.
IDs are UUIDs. Arrays preserve explicit rule order; Sets index duplicates.

The backend serializes mutations. A command derives a new immutable state,
validates it, writes and fsyncs a sibling temporary file, atomically renames it,
then publishes the new state. Failed writes leave the old state available.
Reads reject corrupt or future-version files loudly, never replacing them with
an empty ledger. Version 1 is the initial schema; migration dispatch is explicit.
Undo is one in-memory prior state for delete, category merge or import and is
invalidated by the next successful mutation; restart clears it.
If a write reports failure after replacement, the service reconciles the actual
file with its prior and candidate states before retaining or replacing undo.
Unknown or unreadable state clears undo; an error is still reported to the UI.

## Platform integration

`electron/` owns native CSV open/save dialogs. Test paths are preset only through
named environment variables. App data override is likewise environment-only;
test drivers and fixtures stay under `tests/`. Navigation, popups and external
network requests are blocked. Renderer has context isolation and sandbox enabled.

## Ownership and deliberate simplicity

Solo: one agent owns all directories. No delegation except the independent
release bug hunt required by keel-release. No database, service or framework:
the single local file and small vanilla TypeScript views fit this product.
Revisit indexing only when measured ledger latency becomes noticeable; revisit
storage only when atomic rewrites cease meeting the five-second import budget.
CSV parsing has one orchestrator reused by preview, confirmation and round trips.

## Size limits

L0 enforces 400 lines/file, 80 lines/function, depth 4, complexity 15 and five
parameters. Tests may exceed function length only. One component/class/view model
has at most 400 lines and 25 public members across files; review enforces this.
Split modules in the slice that grows them; changes to limits require an ADR.
<!-- keel:end -->
