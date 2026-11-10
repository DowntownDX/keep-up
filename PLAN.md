# Phase 5 plan — side hustle and upgrades

Goal: add Find clients and Client work, the Prompt library and Skills systems,
team bonuses, and the UI to buy them. Engine stays pure.

Baseline: `npm test` 93/93, `npm run build` clean at `4d4481e`.

## Steps

- [x] 1. Confirm baseline.
  Check: 93 tests pass, build clean, only PLAN.md modified.
  Evidence: `npm test` 93/93, `npm run build` clean, only PLAN.md modified.

- [x] 2. Save v4, upgrades and side hustle in one engine pass. Add
  `promptLevel` and `skillsLevel`; bump `SAVE_VERSION` to 4 with a v3 migration
  and a literal v3 fixture. Put every cost and bonus in `config.ts`. Add
  `findClients` (0.1 Leads/s) and `clientWork` (0.2 Leads handled/s, 8 Cash and
  5 Credits per Lead) with `unlockVentures: 1`.
  `workerRate(state, worker, activity)` returns activity base units after
  specialty, worker skill, prompt, skills and team multipliers; Client work
  reports Leads handled, not Cash. Client work cash is `handled x 8`, capped by
  both stocks, with XP by the fraction worked. `assignActivity` and save
  validation reject locked activities. `resourceRates` converts Client work to
  Cash; `resourceNetRates` subtracts Leads and Credits demand and never returns
  early on win.
  Check: tests cover v3 migration and v4 validation, prompt/skills costs and
  purchases, multiplier stacking, team bonus per activity, unlock gates, Find
  clients, Client work full speed and both starvations, no negative stock, and
  net rates; `npm test` green.
  Evidence: tests 111/111; save tests 17, side-hustle tests 8, upgrades 8.

- [x] 3. Upgrade UI. Add a keyboard-reachable Prompt library / Skills tab card
  with level, effect, next cost and buy button. Render Find clients and Client
  work disabled with an unlock note until venture 1. Thread buy actions through
  `useGame`. Keep the ledger direction and net rates.
  Check: `npm run build` clean; tabs expose tab/tabpanel semantics; buying
  deducts the right resource and the shown rate changes.
  Evidence: build clean; fixed a `[hidden]` override so one panel shows;
  `verify:ui` bought a Skills level and checked the cost drop.

- [x] 4. Browser verification, docs and commit. Extend `verify:ui` for locked
  activities and a Skills purchase, update the save version assertion, re-run
  screenshots at both widths, document, run all checks and commit.
  Check: `npm test`, `npm run build`, `npm run sim` and `npm run verify:ui`
  pass; decisions and spec updated; commit author DowntownDX with co-author
  trailer.
  Evidence: 111/111 tests, build clean, sim stub runs, `verify:ui` passed with
  locked buttons and a Skills purchase; docs updated.

## Resolved assumptions

- Client work's base unit is a Lead handled. Cash is never treated as the base
  rate, so one multiplier pass produces `handled x 8`.
- Prompt skips Cash-producing activities (day job, Client work); Skills skips
  Learn. Both apply to build points.
- Prompt, Skills, specialty, worker skill and team multipliers multiply.
- Team bonus keys by activity, so an Assistant's day-job level cannot boost
  Client work; levels above 1 only; the specialist is included.
- A save with a worker on a locked activity is invalid.
- Buying has no level cap; Phase 8 tunes pacing.

## Out of scope

- Automations, audience funnel, follower gates (Phase 6).
- Release clock, subscriptions, Edge (Phase 7).
- Welcome-back summary, reset, guide, deploy (Phase 9).
