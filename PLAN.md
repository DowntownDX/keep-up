# Phase 1 rework plan

Goal: fix the real defects in the Phase 1 engine and close missing rule tests.
No Phase 2 work and no new game features.

Baseline: `npm test` 27/27 passed, `npm run build` clean, `git status` clean at `24088a7`.

## Steps

- [x] 1. Confirm baseline at HEAD.
  Check: 27 tests pass, build succeeds, working tree clean. Evidence: done before edits.

- [x] 2. Make ticks actually fixed. Add `pendingSeconds` to `GameState`; `step` banks
  fractional seconds and runs only whole `TICK_SECONDS` ticks. Remove the
  variable-`dt` path.
  Check: new tests prove `step(0.5) + step(0.5)` equals `step(1)`, 10 x 0.1s
  produces one tick, a lone 0.5s step produces nothing, and the existing 60s
  and 3600s tests still pass.
  Evidence: `npm test` 30/30 passed, including the three new fractional-step tests.

- [x] 3. Tighten `assignActivity` so it rejects a key whose config value is
  `undefined`, not just a missing key.
  Check: existing "build is not implemented" test still passes; `npm test` green.
  Evidence: guard now checks `ACTIVITIES[activity] === undefined`; 31 tests pass.

- [x] 4. Remove duplicated config truth: derive `MAX_AGENTS` from
  `AGENT_KINDS.length`; keep seat costs aligned with it.
  Check: new config test asserts `AGENT_SEAT_COSTS.length === MAX_AGENTS`;
  `npm test` green.
  Evidence: `tests/config.test.ts` added; 31 tests pass.

- [x] 5. Add missing rule tests: a hired Creator earns Followers at 1.6x through
  `step`, two workers level independently, and a higher subscription tier raises
  Credits during `step`.
  Check: each new test fails if the matching rule is broken; `npm test` green.
  Evidence: `npm test` 34/34 passed. One wrong test expectation (You kept
  earning XP after the agent switched) was corrected; the engine was right.

- [x] 6. Document Phase 1 decisions in `docs/spec.md` (starts idle, one hire per
  specialist, additive skill bonus, whole-second ticks); fix both tick comments;
  delete stale `src/engine/.gitkeep`.
  Check: `git grep -n "fixed ticks"` shows accurate text; `npm run build` green.
  Evidence: grep found no stale claims; `npm test` 34/34 and build clean after
  the doc and comment edits.

- [x] 7. Full verification and commit.
  Check: `npm test` and `npm run build` pass; `git status` clean; commit author
  DowntownDX and co-author trailer present.
  Evidence: `npm test` 34/34, `npm run build` clean, commit author DowntownDX,
  co-author DeepSeek V4.1 Flash.

## Out of scope

- `saveVersion` and persistence: Phase 3 owns them. No save exists yet, so the
  `pendingSeconds` field needs no migration.
- Edge multiplier, ventures, subscriptions, UI.
