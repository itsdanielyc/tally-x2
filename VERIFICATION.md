# Verification ledger

Append-only. Each row says what was proven, where, and by which run. "Built"
is never rounded up to "tested"; anything not listed here is unverified.

| Date | Level | Claim | Platforms | Evidence |
|---|---|---|---|---|

## Unverified

- No required pre-tag Keel gate remains unverified for pinned candidate
  `fb1aa5135d5c5d1c24b24caef00f46aa764e7097`.
- Physical power interruption, screen-reader L8 checks and post-tag
  published-asset installs remain unverified. Native file-dialog journeys use
  the documented preset-path bypass; manual OS dialog interaction was not driven.
- Bundles are intentionally unsigned/not notarized, as ADR 001 specifies.

| 2026-11-18 16:43 UTC | L0/L1 contract preparation | Version-zero migration and invalid file/IPC payloads; new schema tests first observed red (wrong GBP/empty state; expected function to throw), restored green | local windows-x64 | npm run lint exit 0; npm run test:unit exit 0, 10 tests; hosted Tier 1 pending |

| 2026-11-18 16:59 UTC | L0-L6 slice 1 local preparation | Integer CRUD, mock/file parity, atomic-save failures, corrupt file refusal, browser CRUD/settings and full Electron restart | local windows-x64 | lint exit 0; unit 25 passed; UI behavior 2 passed; L6 5 passed; red: stub money returned 0 vs -1234, no persisted file, corrupt snapshot resolved, missing native Transactions; dedicated-port mutation red: GBP 0.00 vs -12.34 and missing fractional-cent alert; restored green. Hosted gate pending. |

| 2026-11-18 17:06 UTC | L0/L1 CSV contract preparation | Bounded import payloads, mapping indexes and date/decimal options | local windows-x64 | lint exit 0; unit 27 passed; red: Unknown ledger command and invalid mapping failed to throw; then green. Hosted evidence pending. |

| 2026-11-18 17:16 UTC | L0-L6 CSV local preparation | Mapping/preview/diagnostics, exact duplicate detection, atomic accepted-row import, native file selection and 2,000-row budget | local windows-x64 | lint exit 0; unit 36 passed including real-file import under 5s; browser 3 passed; L6 6 passed. Red: wrong delimiter/header, missing accepted rows, Unknown ledger command, no native Import CSV control; parity mutant expected 2 got 0; duplicate mutant reimport accepted 1 instead of 0. Hosted gate and refreshed pixels pending. |
| 2026-11-18 17:18 UTC | L0/L1 scaffold harness repair | Snapshot artifacts cannot overwrite another OS with stale pixels | local windows-x64 | snapshot-artifacts.test.ts observed red with unwanted darwin/win32 PNGs, then green; lint and unit exit 0. Actual captured PNGs reviewed for all three systems. |

| 2026-11-18 17:25 UTC | L0/L1 category contract preparation | Category and rule command shapes reject empty names and matches | local windows-x64 | lint exit 0; unit 39 passed; red: new commands unknown; blank-name bypass mutant failed to throw; restored green. |

| 2026-11-18 17:32 UTC | L0-L5 category local preparation | Category reference integrity, rule priority, import-preview parity, explicit categorisation and UI management | local windows-x64 | lint exit 0; unit 43 passed; 5 browser journeys passed; red: Unknown ledger command, missing Categories control, preview category null vs Food; all restored green. Categories UI image reviewed. Hosted L5 pending. |

| 2026-11-18 17:35 UTC | L0/L1 budget contract preparation | Validated calendar months, nonnegative integer budgets, zero and removal | local windows-x64 | lint and unit exit 0; positive budget command first observed red as Unknown ledger command. |

| 2026-11-18 17:40 UTC | L0-L5 summary local preparation | Exact category/month income, spending, net and budgets, leap/year boundaries and totals beyond safe numeric sums | local windows-x64 | lint exit 0; unit 50 passed; 6 browser journeys passed. Red: zero totals vs 9898 minor units, wrong year rollover, unknown budget command, missing summary control; negative-budget bypass failed to throw. Summary image reviewed. Hosted L5 pending. |

| 2026-11-18 17:45 UTC | L0/L1 find/export/undo contract preparation | Inclusive filter validation, export receipt and one undo payload | local windows-x64 | lint and unit exit 0; red: filters returned defaults instead of supplied fields; reversed bounds failed to throw; then green. |

| 2026-11-18 18:20 UTC | L0-L6 find/export/undo local preparation | Inclusive filters, exact canonical CSV including duplicate identities, one-step undo, atomic export and desktop bridge failure handling | local windows-x64 | lint exit 0; 60 unit assertions, 19 browser behavior/structure/geometry checks and 7 Electron checks pass. Red: filters returned all rows; export returned zero/null; undo unavailable; directory-alias export overwrote a missing ledger; missing desktop bridge used mock; multiline edit lost CRLF. All fixed with red/green regressions. New visual structure/geometry cases each observed missing-baseline red; pixels await runners. |

| 2026-11-18 18:40 UTC | L0/L1/L7 release harness preparation | Version and checksum gates, exact-commit release gate, installed-binary driver | local windows-x64 | version/checksum tests green, deliberately broken to red (drift accepted; zero digest), restored green; installed driver rejected unpackaged Electron (expected true, got false); release gate rejected unproven 79c402b. Hosted installed-binary positive proof pending. |

| 2026-11-18 19:05 UTC | L0/L1 release contract correction | Valid CSV text is not rejected by the former cap; header row indexes are independent of column bounds | local windows-x64 | lint exit 0; CSV contract 3 passed after red CSV exceeds the 20 MiB limit; the retired arbitrary-cap assertion is replaced by the large-round-trip regression and strict non-text validation. |

| 2026-11-18 19:31 UTC | L0-L7 scaffold | Slice 0 green on main 590a278; per-OS runner pixels reviewed | windows-x64, macos-arm64, linux-x64 | [CI 44372039322](https://github.com/itsdanielyc/tally-x2/actions/runs/44372039322), [installers 44372039307](https://github.com/itsdanielyc/tally-x2/actions/runs/44372039307), all matrix jobs green. |

| 2026-11-18 19:31 UTC | L7 installed-binary harness | Packaged binaries preserve an existing ledger, write, restart and uninstall on source 088a34a | windows-x64, macos-arm64, linux-x64 | [installers 44372351324](https://github.com/itsdanielyc/tally-x2/actions/runs/44372351324), installed-OS screenshots and bundle/checksum artifacts; final corrected candidate still requires its own run. |

| 2026-11-18 19:31 UTC | Independent review + local regressions | Fresh reader found 3 defects at 8ffa92e; all locally corrected without changing fixed scope | local windows-x64 | docs/BUG-HUNT.md; 70 unit assertions and 21 non-pixel browser checks pass; 7 native checks pass. Red: stale Undo resolved and removed C, header line 2 vs 1, absent Header line selector, committed UI record missing, and >20 MiB self-export rejected. Header selector ARIA refreshed; independent re-check and corrected hosted pixels pending. |

| 2026-11-18 20:27 UTC | L0-L6 corrected candidate | All carried feature checks, 70 unit assertions, 27 browser checks and 7 native checks green on e8b1a26 | windows-x64, macos-arm64, linux-x64 | [CI 44385339940](https://github.com/itsdanielyc/tally-x2/actions/runs/44385339940), all verify jobs and contact sheet green. Source matches independently rechecked 2b09dd8; pixel-only capture commit. |

| 2026-11-18 20:27 UTC | L5 visual review | Reviewed 18 runner PNGs for empty, populated/find, categories/rules, budgets, import diagnostics and undo | windows-x64, macos-arm64, linux-x64 | [snapshots 44381416035](https://github.com/itsdanielyc/tally-x2/actions/runs/44381416035), artifacts/final-sheet.html and final-sheet.png inspected; no clipping or collapsed layout observed. |

| 2026-11-18 20:27 UTC | Independent review re-check | All 3 original findings fixed; no new defect found in fixes at 2b09dd8 | local windows-x64 | Fresh read-only release_bug_hunt reader: 28 focused tests, 4 Chromium tests, 3 original reproductions and 2,000 generated quote/newline/Unicode parser checks; docs/BUG-HUNT.md. |

| 2026-11-18 20:44 UTC | L0-L6 slices 1-5 complete | All fixed feature done conditions on corrected source, including 2,000-row budget and exact large CSV round trip | windows-x64, macos-arm64, linux-x64 | [CI 44391814461](https://github.com/itsdanielyc/tally-x2/actions/runs/44391814461) at e192e56, 70 unit assertions, 27 browser checks and 7 native checks; independent re-check at identical product source 2b09dd8. All feature/contract/fix PRs 1-14 merged in dependency order. |

## Final pre-tag attestation

Candidate: fb1aa5135d5c5d1c24b24caef00f46aa764e7097 (0.1.0, on main). This attestation is documentation-only; tag the pinned tested candidate, not this follow-up.

| Date | Level | Claim | Platforms | Evidence |
|---|---|---|---|---|
| 2026-11-18 21:11 UTC | L0-L6 final candidate | Version/types/lint/dead-code limits, 70 unit/contract/I-O assertions, 27 browser checks, 7 native checks; all fixed slices 0-5 complete | windows-x64, macos-arm64, linux-x64 | [CI 44394134197](https://github.com/itsdanielyc/tally-x2/actions/runs/44394134197), success on exact candidate; first macOS job never acquired a runner, requeued without changing code; all verify jobs and contact sheet green. |
| 2026-11-18 21:11 UTC | L7 final candidate | NSIS, DMG, deb and AppImage installed, launched against a saved ledger, wrote, restarted and uninstalled; SHA256 manifests generated | windows-x64, macos-arm64, linux-x64 | [installers 44394134219](https://github.com/itsdanielyc/tally-x2/actions/runs/44394134219), all 3 jobs green on exact candidate. Four installed-binary screenshots reviewed in artifacts/installed-sheet.html; bundle/checksum and installed-OS artifacts retained. |
| 2026-11-18 21:11 UTC | Release readiness | Slice 6 complete before tag: fixed scope, merged changelog provenance, independent three-finding hunt and successful re-check, unsigned disclosure, exact-commit gates | all Tier 1; Tier 2/3 empty by fixed ADR | npm run check:release -- fb1aa5135d5c5d1c24b24caef00f46aa764e7097 exit 0; npm run check:version exit 0; docs/BUG-HUNT.md and docs/RELEASE-NOTES.md. No tag or GitHub release created. |
