# Tally v0.1.0 plan

<!-- keel:start -->
The fixed scope and sequence are SLICES.md. One builder, solo. All required
levels must be green on every Tier 1 platform before a row becomes done.

| # | Slice | Done when | Levels | Owner | Status |
|---|---|---|---|---|---|
| 0 | Scaffold | electron-web template lint/unit/UI/real-shell and installer workflows green on windows-x64, macos-arm64, linux-x64; runner visual baselines reviewed; ledger links recorded | L0-L7 | solo | open |
| 1 | Record transactions | add/edit/delete and newest-first list; safe integer money/currency settings; versioned atomic save survives restart; validation, contract parity, file failures, UI and real restart tests green | L0-L6 | solo | open |
| 2 | Import a bank CSV | detected delimiter/header, mapped signed or debit/credit columns, date order and preview; line diagnostics, duplicate counts and atomic confirmation; CSV/import/UI/native-dialog-bypass tests green; 2,000 accepted rows under 5 seconds | L0-L6 | solo | open |
| 3 | Categories and rules | create/rename/delete/merge and uncategorisation; ordered contains rules on import and explicit uncategorised application; category/domain/UI/contract tests green | L0-L5 | solo | open |
| 4 | Monthly summary and budgets | chosen month/previous/next, exact category/income/spending totals and monthly budgets remaining/over; boundary/domain/UI/contract tests green | L0-L5 | solo | open |
| 5 | Find, export, undo | payee/note search, category/date/amount filters; export shown records and reimport unchanged; one immediate undo for delete/merge/import; domain/round-trip/UI/native export tests green | L0-L6 | solo | open |
| 6 | Release readiness | 0.1.0 version/changelog, independent bug hunt with findings resolved, final CI and L7 on release candidate commit, unsigned warnings and exact evidence recorded; no tag or GitHub release | L0-L7 | solo | open |

## Rulings

- Planning: Ruling: default currency GBP, editable in settings without conversion — locale is unspecified — cost if wrong: choose another currency before entering records.
- Planning: Ruling: bundle identifier `com.example.tally` — none supplied; scaffold convention — cost if wrong: change before a later signed release.
- Planning: Ruling: undo is immediate, memory-only and invalidated by another successful mutation — matches one immediate undo and avoids persisting historical personal data — cost if wrong: future history feature needs a new slice.
- Planning: Ruling: no Product Frontend Design skill is installed by that name; keep a short DESIGN.md — requested scope is implementation — cost if wrong: aesthetic follow-up.
- Planning: Ruling: push/PR/merge/workflow actions proceed without confirmation — explicitly authorised for this unattended run — cost if wrong: reversible repository history.
- Planning: Ruling: release bug hunt may use one fresh reader as keel-release explicitly requires; implementation remains solo — independent review catches shared author/test assumptions — cost if wrong: review overhead only.
<!-- keel:end -->

Ruling: pin macOS CI to macos-15 and assert arm64 in the real shell � macos-latest remained queued while other runners finished � cost if wrong: the architecture assertion fails and the runner must be revised.

Ruling: prepare later slices on isolated branches while macOS hosted jobs queue; do not mark scaffold or any slice done until its Tier 1 evidence exists � all macOS label probes remain queued � cost if wrong: prepared work waits unmerged for the scaffold gate.

Ruling: combine L0-L6 commands in one hosted job per Tier 1 OS � repeated macOS job startup/queue dominates runtime � cost if wrong: a failure stops later levels on that OS until fixed; all three remain required.
