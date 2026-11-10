# Phase 6 plan — automations, audience and gates

Goal: automations, the audience funnel and Follower gates on ventures 6-10.
Engine stays pure.

Baseline: `npm test` 111/111, `npm run build` clean at `6b0e2f0`.

## Steps

- [x] 1. Confirm baseline.
  Check: 111 tests pass, build clean, only PLAN.md modified.
  Evidence: `npm test` 111/111, `npm run build` clean, only PLAN.md modified.

- [x] 2. Engine pass. Put 50%, 1 Lead/2,000 Followers, 5,000 and x6 in
  `config.ts`. Add `automation: { activity, rate } | null` to `Worker`, not a
  separate state list. Bump `SAVE_VERSION` to 5; v4 adds `automation: null` to
  every worker. `recordAutomation` snapshots 50% of the agent's current output,
  fixed, no XP, one per agent, You rejected.
  Tick order: Credits, passive Cash, audience funnel Leads, workers,
  automations, then shipping. Build and Client work automations reuse the
  stock-capped burn. A gated venture blocks build progress, burn, automation
  build output and shipping; overflow that lands on a gate is discarded.
  Audience funnel is `followers / 2000` after venture 3. Gates start at venture
  6 with 5,000, x6.
  Check: tests cover recording, fixed snapshots after reassignment and later
  upgrades, no automation XP, build/client burn, funnel unlock/order, gate block
  and release, gate-overflow discard, v4 migration and v5 validation;
  `npm test` green.
  Evidence: automation tests 12, save tests 21, suite 127/127.

- [x] 3. UI, browser check, docs and commit. Show recorded automation and a
  Record/Update button on agent cards after venture 2; show the Follower
  requirement in the venture card and disable Build activity buttons while
  gated. Extend `verify:ui` to record an automation and keep the venture-2 run.
  Re-run screenshots, document, run all checks and commit.
  Check: `npm test`, `npm run build` and `npm run verify:ui` pass; decisions and
  spec updated; commit author DowntownDX with co-author trailer.
  Evidence: 127/127 tests, build clean, `verify:ui` recorded an automation,
  checked the gated venture 6 state, and kept 0 overflow at both widths; docs
  updated.

## Resolved assumptions

- Storing the snapshot on the worker makes one-per-agent structural and removes
  a duplicate lookup table.
- The snapshot is the current full rate x 0.5, frozen; later Prompt, Skills or
  team changes do not raise it.
- Automations run after workers, so a worker can change activity and the
  automation still runs; shipping sees both contributions.
- The audience funnel lands before workers, so fresh Leads can be spent by
  Client work in the same tick.
- A gate check runs before every venture in the ship loop. Overflow that would
  start a gated venture is discarded, not banked.
- You cannot record an automation; agent cards only.

## Out of scope

- Release clock, subscriptions, Edge (Phase 7).
- Welcome-back summary, reset, guide, deploy (Phase 9).
