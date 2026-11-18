# Independent release defect hunt

<!-- keel:start -->
Reader: fresh read-only agent `/root/release_bug_hunt`, with no build conversation.
Reviewed commit: `8ffa92e61392385b96ca2ef7444b81e18618f541`.
Local reproduction: Windows x64, 2026-11-18 18:45:48 UTC. Source was unchanged.

| Finding | User impact | Regression and observed red | Resolution |
|---|---|---|---|
| P1: write committed before its promise rejected, leaving older undo | Undo could erase a newly committed transaction | `tests/unit/post-commit.test.ts`: stale undo resolved instead of rejecting; committed delete/merge/import had no correct undo; committed undo remained available. `tests/ui/find.spec.ts`: committed record absent after an error | Re-read validated storage on failure; distinguish old, candidate and unknown state; update undo only for the state actually committed. Refresh changed UI state after errors while retaining an uncommitted form draft |
| P2: a dated row with payee Debit outranked an unknown header | A valid transaction was silently skipped | `tests/unit/csv.test.ts`: header line 2 instead of 1. `tests/ui/import.spec.ts`: no Header line control | Exclude date-like candidates, require multiple recognised labels, retain an early fallback and allow explicit header correction |
| P2: exports could exceed the 20 MiB import cap | Tally could not reimport its own valid CSV | `tests/unit/export.test.ts`: 1,050 valid long-text records rejected with CSV exceeds 20 MiB; CSV contract also observed red | Remove the arbitrary cap; sniff 64 KiB for delimiter selection, parse the document once and build fields from slices instead of character concatenations |

All listed regression tests pass locally. The combined focused CSV/import/export
and post-commit suite (including the large real-file round trip) passed in 1.51s.
The complete unit suite has 70 assertions. The same independent reader rechecked
commit `2b09dd8fb716733da4089991d39218745ffe4697`: all three original reproductions
now pass, including the 21,038,844-byte native-file round trip restoring all
1,050 records exactly. They also passed 28 focused L1-L3 tests, four Chromium
tests and 2,000 generated quoted-document/max-length Unicode parser checks.
No new defect was found in the fixes. Hosted candidate proof remains a separate gate.

The reader did not exercise dialogs, installers, physical power interruption or
macOS/Linux runtime behavior. Post-rename failure was injected against real files.
<!-- keel:end -->
