# Phase 2 plan — ventures

Goal: add the Build venture activity, starvation, shipping, passive income and
unlock flags to the pure engine. No UI.

Baseline: `npm test` 34/34, `npm run build` clean, `git status` clean at `01bb857`.

## Steps

- [x] 1. Confirm baseline at HEAD.
  Check: 34 tests pass, build succeeds, tree clean.
  Evidence: `npm test` 34/34, `npm run build` clean, only PLAN.md modified.

- [x] 2. Venture data, state and helpers, plus fix tests that assumed build was
  unimplemented. Add to `config.ts`: ten venture names, build points 60 with 5x
  growth, burn 1 Credit and 0.2 Know-how per point, income 0.5 Cash with 3x
  growth, system unlock map, and a `build` activity entry at 1 point/s. Add
  `venturesShipped` and `ventureProgress` to `GameState`. Add
  `src/engine/ventures.ts` with `buildPointsRequired`, `ventureIncome`,
  `passiveCashRate`, `currentVentureIndex`, `isSystemUnlocked`, `hasWon`.
  Update `actions.test.ts` to reject `findClients` instead of `build`, and
  `rates.test.ts` to use an unimplemented activity.
  Check: `tests/ventures.test.ts` covers venture math, unlock thresholds and the
  ten-venture list; `npm test` green.
  Evidence: `tests/ventures.test.ts` 9 tests added; `npm test` 44/44.

- [x] 3. Build, shipping, income and unlocks in `step`. Per tick: add Credits
  trickle and passive Cash, run every worker's output (build output is capped by
  stock, burns both resources, and awards XP by fraction of the tick worked),
  then ship completed ventures once after the worker loop. Building is inert
  after ten ships. `resourceRates` adds passive Cash and stays gross production.
  Check: tests cover full-speed burn, half-starved, fully starved, exact-stock
  boundary, ship venture 1, overflow carry, multi-ship, all-ten inert, unlock
  flags, income starting after the ship, and 3600s vs 1s while building;
  `npm test` green.
  Evidence: `tests/build.test.ts` 9 tests added; `npm test` 54/54.

- [x] 4. Document decisions, run full checks and commit.
  Check: `docs/spec.md` records auto-ship, overflow, XP fraction, income timing
  and inert end state; `npm test` and `npm run build` pass; `npm run sim` still
  runs its stub; commit author DowntownDX with co-author trailer.
  Evidence: `npm test` 54/54, `npm run build` clean, `npm run sim` prints its
  phase 8 stub, spec section added, commit verified below.

## Resolved decisions

- Shipping is automatic. The spec lists no Ship action.
- Overflow points carry into the next venture; one tick can ship more than one.
- Build XP is `tick x (points produced / points possible)`, so the level
  multiplier cannot compound XP.
- Passive income starts on the tick after a venture ships.
- Building after all ten ventures is inert: no burn, no XP, no progress.
- `resourceRates` reports gross production per resource. Build burn is
  stock-capped, not a rate, so it is not subtracted there.

## Out of scope

- Follower gates on ventures 6-10 (Phase 6); auto-ship must later halt at a gate.
- Save serialization (Phase 3). No save code exists yet, so the new fields join
  the first save format rather than migrating.
- UI, prompt library, skills, automations, audience funnel effects, Edge.
