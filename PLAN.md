# Phase 8 plan — sim bot, pacing and balance

Goal: a headless bot plays a fresh game for thirty simulated days, prints every
milestone and Edge, and `npm run sim` fails when the pacing targets are missed.
Tune `config.ts` until the run passes; log every change in `balance-log.md`.

Baseline: `npm test` 150/150, `npm run build` clean at `69e116f`.

## Steps

- [x] 1. Confirm baseline.
  Check: 150 tests pass and build clean at `69e116f`; only `PLAN.md` differs.
  Evidence: `npm test` 150/150, `npm run build` clean, `git status --short`
  shows only `PLAN.md` at `69e116f`.

- [x] 2. Record the Phase 8 contract in `docs/decisions.md`: bot policy,
  milestone definitions, target ranges, the no-clicks assumption, and the rule
  that behaviour changes live in `config.ts` while pinned test numbers follow
  the tune and are never weakened.
  Check: one Phase 8 section lists policy, milestones, targets and logging; no
  code touched.
  Evidence: Phase 8 section added; `Still open` now lists Phase 9 only.

- [ ] 3. Bot core and one target table: add `src/sim/bot.ts` with a
  deterministic rule-based player (hire in a fixed order, keep Learn ahead of
  build burn, staff Cash, Followers and Leads, upgrade the subscription when a
  release is out and Cash allows, buy the cheaper upgrade with a reserve,
  record and update automations) and a report with venture ship times, Edge at
  each ship, first-hire and first-gate times, Edge time distribution and
  fall-behind episodes. Put every target range in `src/sim/targets.ts` so the
  CLI and tests share one source. Add `tests/sim.test.ts` with a short run that
  ships venture 1, keeps resources non-negative and repeats identically.
  Check: `npm test -- sim` green; a 10-minute run finishes in under a second.
  Evidence: `tests/sim.test.ts` 3/3 green; a one-day run takes about half a
  second; `npm run build` clean.

- [ ] 4. CLI: replace the `src/sim/run.ts` stub with a thirty-day run that
  prints the milestone table and target checks, exits nonzero on a miss, and
  accepts `--days` and `--json` for cheap tuning passes. Run it once on the
  current config and record the actual times.
  Check: `npm run sim` prints every milestone, the Edge at each venture and a
  PASS/FAIL line per target; `--days 1` and `--json` work; the baseline run is
  recorded in the plan evidence.
  Evidence: baseline on the Phase 7 numbers: V1 1:25, V2 4:40, V3 17:35,
  V5 3:16, gate never, V10 not reached, Edge at max 100%. All 7 pacing targets
  and 2 arms-race checks failed.

- [ ] 5. Tune the early game until the first agent, venture 1 and venture 2
  land in their target ranges. Adjust `config.ts`; update the pinned test
  expectations the change moves, without weakening assertions; rerun the sim
  and record each attempt.
  Check: sim report first agent under 2 minutes, venture 1 in 3-5 minutes and
  venture 2 in 15-20 minutes; `npm test` green.
  Evidence: first agent 0:30, V1 4:00, V2 15:20; `npm test` 153/153 after the
  pinned numbers followed the tune.

- [ ] 6. Tune the middle game until venture 3 is about an hour, venture 5 ships
  by the end of day 1, and the first Follower gate is reached on day 2.
  Adjust `config.ts` and its pinned tests; rerun and record each attempt.
  Check: sim report venture 3 in 50-75 minutes, venture 5 by 24 hours and first
  gate in 24-48 hours; `npm test` green.
  Evidence: V3 50:45, V5 6:14, first gate 25:15; `npm test` 153/153.

- [ ] 7. Tune the late game and the arms race: venture 10 in 14-21 days, at
  least two fall-behind-then-catch-up episodes before generation 10, and Edge
  neither pinned at 1.5 nor at 0.9 before generation 10 (generation 10 itself
  arrives on day 17, so the last stretch is expected to sit at 1.5). Adjust
  `config.ts` and its pinned tests; rerun and record each attempt.
  Check: sim report venture 10 in 14-21 days, fall-behind episodes >= 2, final
  Edge 1.5, at least three distinct Edge values, and less than 80% of the
  pre-generation-10 time at the maximum Edge.
  Evidence: V10 18d 03:14, 4 fall-behind episodes, 3 Edge values, final Edge
  1.5, 34% of the run at the maximum Edge; all 7 pacing and 4 arms-race checks
  pass.

- [x] 8. Final pass: run the full sim, write `docs/balance-log.md` entries for
  every tuning round with the run that justified it, update `docs/spec.md`
  where tuned numbers differ from the first draft, mark this plan complete, run
  `npm test`, `npm run build` and `npm run sim`, and commit as DowntownDX with
  the DeepSeek V4.1 Flash co-author trailer.
  Check: all three commands pass, `git status` clean, commit message names
  Phase 8, and the balance log has one entry per tuning round.
  Evidence: `npm test` 153/153, `npm run build` clean, `npm run sim` PASS with
  exit 0, `npm run verify:ui` PASS with 0 overflow; five balance-log entries;
  committed as `Phase 8: sim bot, pacing and balance`.

## Resolved assumptions

- The bot plays idle/automated: no Do it yourself clicks, because the targets
  describe a player who checks in a few times a day.
- The sim runs continuous game time for 30 days, in fixed steps, with no
  offline gaps; the 8-hour cap is a real-player limit, not a sim limit.
- Milestones are measured from a fresh game. "First Follower gate" is the first
  tick where the current gated venture has enough Followers to launch.
- The bot covers every resource a build burns before it builds: Learn runs
  ahead of Know-how burn and the Credits trickle is not spent on upgrades that
  would starve the next build.
- Balance changes live in `config.ts`; `docs/spec.md` keeps the design but its
  first-draft numbers are updated to the tuned ones.
- `npm run sim` is a check, not a demo: a missed target sets a nonzero exit
  code so the phase cannot pass silently.

## Out of scope

- UI changes, new systems, welcome-back summary, reset, guide, deploy.
- Real-player telemetry; targets stay proposals until people play.
