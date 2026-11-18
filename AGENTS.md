# Tally

Tally is one person's offline expense ledger for Windows x64, macOS arm64 and
Linux x64. PRODUCT.md, docs/adr/, keel.json and SLICES.md are fixed inputs.

<!-- keel:start -->
## Keel

Use only this repository's `.agents/skills/keel*` or `.claude/skills/keel*`.
Implement the seven fixed slices in PLAN.md, solo, in sequence. No new scope.

## Commands

- L0: `npm run lint` (types, ESLint, knip).
- L1-L3: `npm run test:unit`.
- L4-L5: `npm run test:ui`, labelled browser mock.
- L6: `npm run build`, then `npm run test:e2e`.
- L7: `npm run package`, hosted `installers` workflow.
- CI digest: `npm run triage -- <run-id>`.
- Real-app instructions: `.agents/skills/verify-tally/SKILL.md`.

## Layout and ownership

Solo owns every directory. `src/` presents; `src/api.ts` is the renderer seam.
`contracts/` shares validated shapes; `domain/` computes; `backend/` coordinates;
`persistence/` writes; `electron/` integrates the OS. See ARCHITECTURE.md.
`tests/` drives shipped paths. `VERIFICATION.md` is the append-only ledger.

## Firm rules

1. Every tested claim names level, platform and run; otherwise say built.
2. Observe each new/rewritten test red, then green; record the failure.
3. Contract extensions land in their own small PR before implementation.
4. PNG baselines come from hosted snapshots workflow and are visually reviewed.
5. Quarantine flakes with an issue; no silent deletion or timeout inflation.
6. Keep test harnesses out of product code; named environment bypasses only.
7. Enforce 400 lines/file, 80/function and architecture component budgets;
   no suppression comments. Split in the slice that grows a module.
8. Descriptive names, strict typing, small responsibilities, useful docstrings;
   comment why, and state Big-O above complex algorithms. No floating money.
9. Fixed brief, ADRs, tiers and slice list remain untouched. No tag/release.
10. Rulings are written in PLAN.md or PRs. Nobody answers during this run.
11. Read/change only this folder and its GitHub repository.

## Where to look

PRODUCT.md, docs/adr/, ARCHITECTURE.md, TESTING.md, PLAN.md, DESIGN.md and
VERIFICATION.md. Release readiness uses the local keel-release checklist.
<!-- keel:end -->
