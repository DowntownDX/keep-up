# Phase 7 plan — release clock, subscriptions and Edge

Goal: model generations arrive on a game-time clock, Cash upgrades the
subscription up to the latest release, Edge multiplies all Cash earned, and the
screen shows the release timeline and a release news feed. Engine stays pure.

Baseline: `npm test` 127/127, `npm run build` clean at `755a6a3`.

## Steps

- [x] 1. Confirm baseline.
  Check: 127 tests pass, build clean, working tree clean.
  Evidence: `npm test` 127/127, `npm run build` clean, `git status --short`
  empty at `755a6a3`.

- [x] 2. Record the Phase 7 contract in `docs/decisions.md`.
  Check: one Phase 7 section lists clock, Edge, tier cap, migration, feed and
  the 1.5x shift to existing Cash expectations; no code touched.
  Evidence: Phase 7 section added; `Still open` now starts at Phase 8.

- [x] 3. Engine pass, part one: add `elapsedSeconds` to `GameState` and
  `createInitialState`, add the release numbers to `config.ts` and a new pure
  `src/engine/releases.ts` (`releaseTime`, `latestGeneration`, `nextRelease`,
  `generationsBehind`, `edgeMultiplier`, `cashGain`,
  `subscriptionUpgradeCost`, `canUpgradeSubscription`). Generation 1 at zero,
  generation 2 at 150s, each later interval 3x longer, ten total. Edge is 1.5,
  1.25, 1.1, 1, 0.9 by generations behind. Upgrade cost is 50 Cash x 6 per tier.
  Add `tests/releases.test.ts` for the schedule, the Edge table and the cost.
  Check: `npm test -- releases` green; build confirms types.
  Evidence: `tests/releases.test.ts` 8/8 green; `npm run build` clean.

- [x] 4. Save: add `elapsedSeconds` to the `serializeGame` whitelist; bump
  `SAVE_VERSION` to 6; migration 5 sets elapsed to the saved tier's release
  time; validation rejects negative elapsed, a tier above the latest release
  and a tier above ten. Add a v5 fixture with tier 2 and no elapsed field.
  Check: save and release tests green; every prior migration fixture still
  loads at version 6; `serializeGame` output includes elapsed.
  Evidence: save 24/24 and releases 8/8 green; v5 fixture with tier 2 loads
  with `elapsedSeconds` 150; invalid-clock cases rejected; serialize writes
  version 6 with elapsed.

- [x] 5. Clock and Edge wiring: `cashGain(state, amount)` in `releases.ts` is
  the single Edge multiplier. Advance the clock once per tick before
  production. Route day job, Client work payout, cash automations and passive
  venture income through `cashGain`, and use it in `resourceRates` and the
  venture card. Client work still consumes Leads by handled volume and Credits
  at 5 per Lead; XP uses handled, not Cash. Leave burn, Followers, Leads,
  Know-how and Credits unscaled. Update the existing Cash expectations that now
  earn 1.5x at generation 1.
  Check: full suite green, including the new Edge cases and the unchanged
  non-Cash numbers.
  Evidence: `npm test` 148/148; `tests/edge.test.ts` 10/10 covers tick-start
  release, offline release, click clock, day job, passive, Client work, cash
  automation, non-Cash, rates and XP; build clean.

- [x] 6. Subscription action: `upgradeSubscription` in `actions.ts` charges the
  next tier's cost only when that generation is out, the tier is below ten and
  Cash covers it. Add tests that the upgrade raises the Credits trickle and that
  each rejection changes nothing.
  Check: `npm test -- releases` and the full suite green.
  Evidence: releases 10/10; `npm test` 150/150; `npm run build` clean.

- [x] 7. UI: add `ReleaseCard` (generation, Edge, tier and Credits rate, next
  release countdown, ten-step timeline, release news) to the side column, wire
  the upgrade action through `useGame`, and add the card's CSS.
  Check: `npm run build` clean; desktop and mobile screenshots show no overflow
  and the card at 390px.
  Evidence: `npm run build` clean; `artifacts/desktop.png` and
  `artifacts/mobile.png` show the release card at 1440px and 390px with 0
  overflow.

- [x] 8. Extend `verify:ui`: assert generation 1 and Edge x1.5 on a fresh game,
  seed 150 elapsed seconds and Cash, assert generation 2 and Edge x1.25, then
  upgrade and assert tier 2, Edge x1.5 and the higher Credits rate.
  Check: `npm run verify:ui` passes with the new assertions and keeps the
  existing automation and gate checks.
  Evidence: `npm run verify:ui` passed: generation 1/Edge 1.5 on a fresh game;
  seeded generation 2/Edge 1.25; upgrade to tier 2 spent 50 Cash, Edge 1.5 and
  trickle 1.5/s; automation and gate checks still pass; 0 overflow at both
  widths.

- [x] 9. Docs, checks and commit: update `docs/spec.md` with the Phase 7
  section, mark this plan complete with evidence, run `npm test`,
  `npm run build` and `npm run verify:ui`, then commit as DowntownDX with the
  DeepSeek V4.1 Flash co-author trailer.
  Check: all three commands pass; `git status` clean; commit message names
  Phase 7.
  Evidence: `docs/spec.md` Phase 7 section added; `npm test` 150/150,
  `npm run build` clean, `npm run verify:ui` passed; committed as
  `Phase 7: release clock, subscriptions and Edge`.

## Resolved assumptions

- The release clock is game time (`elapsedSeconds`), not wall time. Only
  `step` and offline catch-up advance it; Do it yourself clicks do not.
- The clock advances at the start of a tick, so a generation that lands on that
  tick sets Edge for the same tick's production.
- Edge applies to Cash earned, never to Cash spent or to the starting stock.
  It scales live automation Cash too; the snapshot itself stays frozen.
- The starting free subscription is generation 1, the latest at time zero, so a
  fresh game earns the 1.5x Edge. Existing Cash expectations move by 1.5x.
- A subscription can only rise to a generation that has already been released.
  Tier ten is the cap.
- Lab names are still an operator decision, so the feed names generations, not
  labs.

## Out of scope

- Balance tuning, the sim bot and `balance-log.md` (Phase 8).
- Welcome-back summary, reset, guide, deploy (Phase 9).
