# Phase 3 plan — save and offline

Goal: serializable saves with a version and migration, plus offline catch-up
with an 8-hour cap. Engine only; localStorage belongs to Phase 4.

Baseline: `npm test` 54/54, `npm run build` clean at `83d84e2`.

## Steps

- [x] 1. Confirm baseline at HEAD.
  Check: 54 tests pass, build succeeds, tree clean except PLAN.md.
  Evidence: `npm test` 54/54, `npm run build` clean, only PLAN.md modified.

- [x] 2. Save module with format, validation and migration in
  `src/engine/save.ts`. Envelope is `{ version, state }`, current
  `SAVE_VERSION = 2`. Version 1 is the Phase 1 state shape, reproduced as a
  literal fixture that adds `venturesShipped` and `ventureProgress` on load.
  `serializeGame` writes only known fields; `loadGame` parses, migrates,
  validates and returns `GameState | null`. Validation covers all resources,
  exactly one You, unique worker ids and agent kinds, all six skills, activity
  ids, finite counters, `0 <= pendingSeconds < 1`, `nextAgentNumber` above any
  `agent-N` id, and venture progress below the current requirement.
  Check: rich round-trip is deep-equal; v1 fixture migrates with defaults and
  preserved progress; malformed JSON, non-object JSON, missing version,
  versions 0/99, negative resources, missing skills, bogus activity and a huge
  pending value all return null; `npm test` green.
  Evidence: `tests/save.test.ts` 12 tests added; build clean.

- [x] 3. Offline catch-up in `step.ts`. Add `OFFLINE_CAP_SECONDS` (8h) to
  config. `stepOffline(state, seconds)` ignores non-finite or non-positive
  input, clamps to the cap, and calls the normal `step`, which already advances
  in one-second ticks.
  Check: 8h offline deep-equals 28,800 one-second steps; 9h deep-equals 8h;
  negative, zero, NaN and Infinity leave state unchanged; `npm test` green.
  Evidence: `tests/offline.test.ts` 3 tests added; full suite 69/69.

- [x] 4. Document decisions, run full checks and commit.
  Check: `docs/spec.md` records the envelope, version rule, invalid-save policy,
  8h cap and offline behaviour; `npm test`, `npm run build` and `npm run sim`
  pass; commit author DowntownDX with co-author trailer.
  Evidence: 69/69 tests, build clean, sim stub runs, spec section added, commit
  verified below.

## Resolved decisions

- Version 2 is the first persisted format. Version 1 is the Phase 1 shape, kept
  as a literal fixture so the migration has a fixed target and cannot drift.
- A failed load returns null; the UI decides whether to start fresh or warn.
  It does not distinguish absent from corrupt saves yet.
- Validation rejects impossible states rather than normalizing them. A save
  with `pendingSeconds >= 1` would otherwise hang the first step.
- Offline has no separate chunk loop: `step` already advances in fixed one-second
  ticks, and 28,800 ticks finish in milliseconds.
- Offline is full speed for up to 8 hours; non-finite elapsed time is ignored,
  not treated as infinite.

## Out of scope

- localStorage, autosave, save-on-close, welcome-back UI (Phase 4).
- Follower gates (Phase 6), Edge (Phase 7), sim bot (Phase 8).
