# Changelog

<!-- keel:start -->
## [0.1.0] - 2026-11-18

### Added

- Record, edit and delete transactions in a versioned local ledger with exact
  minor-unit amounts and crash-safe saves. ([PR 3](https://github.com/itsdanielyc/tally-x2/pull/3))
- Map and preview bank CSVs with rejected-row diagnostics and duplicate checks.
  ([PR 5](https://github.com/itsdanielyc/tally-x2/pull/5))
- Organise categories and apply ordered payee rules.
  ([PR 7](https://github.com/itsdanielyc/tally-x2/pull/7))
- Compare monthly income, spending and category budgets.
  ([PR 9](https://github.com/itsdanielyc/tally-x2/pull/9))
- Find transactions, export the shown records without losing duplicate-looking
  purchases, and undo the last delete, category merge or import once.
  ([PR 11](https://github.com/itsdanielyc/tally-x2/pull/11))

### Distribution

- Unsigned Windows x64 NSIS, macOS Apple silicon DMG, Linux x64 deb and AppImage,
  with SHA256 checksums. No account, bank connection or updater.
- All listed feature PRs are merged. Final exact-commit proof is recorded in
  VERIFICATION.md before any tag. This build run creates no tag or GitHub release.
<!-- keel:end -->
