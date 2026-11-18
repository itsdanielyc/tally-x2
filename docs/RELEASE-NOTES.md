# Tally 0.1.0 release readiness

<!-- keel:start -->
Status: candidate preparation. This run stops before the tag and GitHub release.
The tested candidate SHA and final run links will be recorded after checks finish.

## Scope and version

Exactly SLICES.md, built solo. Version is 0.1.0 in package.json and both lockfile
locations; `npm run check:version` rejects drift and mismatched tags. The scaffold
already selected 0.1.0, so there is no second bump. CHANGELOG.md takes its feature
descriptions from the numbered PR titles and ledger; final merge provenance is
still a gate while those PRs are open.

## Pre-tag gates

- [ ] Slices 0-5 have Tier 1 L0-L6 evidence and their fixed done conditions.
- [ ] Empty and populated runner pixels are reviewed.
- [ ] Independent defect hunt is complete; findings have red/green fixes or
  are named under Known defects.
- [ ] Final CI is green on windows-x64, macos-arm64 and linux-x64.
- [ ] Final NSIS, DMG, deb and AppImage installer round trips are green.
- [ ] Installed binaries preserve a saved ledger, write a transaction, reopen
  and uninstall; screenshots and SHA256 sums are retained as workflow artifacts.
- [ ] `npm run check:release -- <candidate-sha>` passes before any tag.

Tier 2 and Tier 3 are empty by the fixed ADR. The tag workflow checks the exact
commit's green CI/installers, version and main ancestry, then rebuilds/installs
from the tag before publishing. It has not been triggered during this run.

## Signing

All 0.1.0 bundles are unsigned; macOS is not notarized, per ADR 001.
Windows can show SmartScreen's **“Windows protected your PC”** warning.
macOS Gatekeeper can report **“Apple cannot check it for malicious software”**
or **“is damaged and can’t be opened”** for a quarantined unsigned download;
exact wording depends on macOS. CI removes quarantine for unsigned install
tests, so those tests do not prove a clean Gatekeeper prompt.

Trusted macOS distribution would require a paid Apple Developer account with an
annual fee, Developer ID signing and notarization. Windows would require an
OV/EV certificate or a signing service such as Azure Trusted Signing. No signing
account, certificate, secret or payment was created or changed.

## Known defects

Independent review pending. This draft makes no final defect-free claim.

## Limits and unverified work

- CSV input is UTF-8 (BOM accepted), at most 20 MiB, with comma/semicolon/tab/pipe
  delimiters and DMY/MDY/YMD numeric dates. Ambiguous formats require selecting
  date/decimal mapping. Two-digit years use the recorded pivot.
- Six two-decimal currencies are supported. Settings relabel amounts without
  conversion; positive amounts are income and budgets compare gross spending.
  Undo is immediate, memory-only and clears on restart.
- Deterministic I/O faults cover pre-rename failure. Physical power interruption,
  hardware failure and screen-reader L8 checks are not proven. Other platforms
  and distributions are outside the fixed tiers.
- Tagging, creating a GitHub release and installing its published assets are
  intentionally post-gate work and are not performed in this run.
<!-- keel:end -->
