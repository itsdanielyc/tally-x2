# Tally v0.1.0 plan

<!-- keel:start -->
The fixed scope and sequence are SLICES.md. One builder, solo. All required
levels must be green on every Tier 1 platform before a row becomes done.

| # | Slice | Done when | Levels | Owner | Status |
|---|---|---|---|---|---|
| 0 | Scaffold | electron-web template lint/unit/UI/real-shell and installer workflows green on windows-x64, macos-arm64, linux-x64; runner visual baselines reviewed; ledger links recorded | L0-L7 | solo | done |
| 1 | Record transactions | add/edit/delete and newest-first list; safe integer money/currency settings; versioned atomic save survives restart; validation, contract parity, file failures, UI and real restart tests green | L0-L6 | solo | done |
| 2 | Import a bank CSV | detected delimiter/header, mapped signed or debit/credit columns, date order and preview; line diagnostics, duplicate counts and atomic confirmation; CSV/import/UI/native-dialog-bypass tests green; 2,000 accepted rows under 5 seconds | L0-L6 | solo | done |
| 3 | Categories and rules | create/rename/delete/merge and uncategorisation; ordered contains rules on import and explicit uncategorised application; category/domain/UI/contract tests green | L0-L5 | solo | done |
| 4 | Monthly summary and budgets | chosen month/previous/next, exact category/income/spending totals and monthly budgets remaining/over; boundary/domain/UI/contract tests green | L0-L5 | solo | done |
| 5 | Find, export, undo | payee/note search, category/date/amount filters; export shown records and reimport unchanged; one immediate undo for delete/merge/import; domain/round-trip/UI/native export tests green | L0-L6 | solo | done |
| 6 | Release readiness | 0.1.0 version/changelog, independent bug hunt with findings resolved, final CI and L7 on release candidate commit, unsigned warnings and exact evidence recorded; no tag or GitHub release | L0-L7 | solo | done |

## Rulings

- Planning: Ruling: default currency GBP, editable in settings without conversion — locale is unspecified — cost if wrong: choose another currency before entering records.
- Planning: Ruling: bundle identifier `com.example.tally` — none supplied; scaffold convention — cost if wrong: change before a later signed release.
- Planning: Ruling: undo is immediate, memory-only and invalidated by another successful mutation — matches one immediate undo and avoids persisting historical personal data — cost if wrong: future history feature needs a new slice.
- Planning: Ruling: no Product Frontend Design skill is installed by that name; keep a short DESIGN.md — requested scope is implementation — cost if wrong: aesthetic follow-up.
- Planning: Ruling: push/PR/merge/workflow actions proceed without confirmation — explicitly authorised for this unattended run — cost if wrong: reversible repository history.
- Planning: Ruling: release bug hunt may use one fresh reader as keel-release explicitly requires; implementation remains solo — independent review catches shared author/test assumptions — cost if wrong: review overhead only.
<!-- keel:end -->

Ruling: pin macOS CI to macos-15 and assert arm64 in the real shell  -  macos-latest remained queued while other runners finished  -  cost if wrong: the architecture assertion fails and the runner must be revised.

Ruling: prepare later slices on isolated branches while macOS hosted jobs queue; do not mark scaffold or any slice done until its Tier 1 evidence exists  -  all macOS label probes remain queued  -  cost if wrong: prepared work waits unmerged for the scaffold gate.

Ruling: sample greeting UI tests retire with the deliberately replaced scaffold UI; shared greeting contract stays until the next PR, while sandbox/platform tests remain and real CRUD/restart replace sample interactions  -  slice 1 replaces the greeting by design  -  cost if wrong: sample-only behavior is no longer exercised in the renderer.
Ruling: combine L0-L6 commands in one hosted job per Tier 1 OS  -  repeated macOS job startup/queue dominates runtime  -  cost if wrong: a failure stops later levels on that OS until fixed; all three remain required.

Ruling: CSV supports UTF-8 with BOM, comma/semicolon/tab/pipe, 20 MiB bound, and two-digit years 00-69 as 2000-2069 and 70-99 as 1970-1999 - deterministic bank formats without guessing an unsupported encoding - cost if wrong: select date order or use a UTF-8 export. Accepted rows commit together; diagnostic rows stay excluded.

Ruling: first case-insensitive contains rule wins; explicit categories take precedence; deleting a category removes its rules and budgets, and merging sums matching monthly budgets - preserves intentional classification and keeps references valid - cost if wrong: later rule-priority controls would be another slice.

Ruling: budgets compare gross negative outflows and positive entries are income; net totals are shown separately, and each month has independent budgets - the transaction schema has no refund kind - cost if wrong: refund treatment needs a later explicit product decision. Summary accumulation uses BigInt so valid individual amounts never overflow monthly totals.

Ruling: Tally exports include stable IDs so distinct identical-looking transactions round-trip unchanged; bank duplicates still use date, amount and payee. Undo includes transaction/category deletion, merge and import, is memory-only, and survives read-only search/export - preserves the brief's round-trip and immediate-undo promises - cost if wrong: alternate CSV consumers ignore the extra column. The obsolete scaffold greeting is retired after its ledger-contract and native-journey replacements.

Ruling: the existing 0.1.0 version remains the first release version; signing stays unsigned as ADR 001 decided. The release automation reuses installer round trips and requires CI/installers on the exact tagged SHA. No tag/release is created. GitHub annotations report macOS arm64 capacity constraints and jobs never acquired; these are queued infrastructure gates, not flaky-test passes.

Ruling: remove the arbitrary 20 MiB CSV cap, superseding the earlier cap ruling - it made a valid 1,050-row Tally export impossible to import - cost: large files require memory; parsing will sniff a bounded prefix and scan the document once. Header row indexes are record indexes, not column indexes.

Ruling: after final candidate CI and installers pass, pin that tested main SHA and append a ledger-only attestation without moving the intended tag target - immutable run IDs are known only after a run - cost: the later tag must use the explicitly pinned SHA, not the documentation-only follow-up commit. No tag is created here.

Ruling: restore generic spike placeholder substitutions in the 62 supplied local Keel files written by the in-place generator - the generator also walked its own installed copies - cost: none to Tally; no other machine skill copy was read, and the app retains its Tally name. All seven fixed slices are done; only the explicitly excluded tag/release and documented unverified limits remain.
