# ADR 002: Platform support

Status: accepted · Date: 2026-11-18 · Decided by: the owner, before planning

## Decision

| Tier | Platforms | What a release needs |
|---|---|---|
| 1 | windows-x64, macos-arm64, linux-x64 | Every level the product uses, green on a hosted runner |
| 2 | none | |
| 3 | none | |

## Why

One person's desktop tool; these three cover the audience and each has a
free hosted runner. Other architectures are added by a later ADR when
someone asks for them.

## Consequences

- CI matrices are derived from `keel.json`: three browser runners, three
  real-shell runners, three installer runners.
- A red on any of the three is a finding, not noise.
