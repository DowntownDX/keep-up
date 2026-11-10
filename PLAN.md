# Phase 4 plan — playable screen

Goal: a browser-playable screen from a fresh game through venture 2, desktop and
phone width, with autosave and offline catch-up. Engine stays pure.

Baseline: `npm test` 69/69, `npm run build` clean at `ed0005f`.

## Direction

Provisional ledger look: paper `#f3ecdf`, ink `#191713`, panel `#fffaf0`, line
`#d9cebd`, action `#c2410c`, growth `#2f6f4e`. Display serif (Palatino/Georgia),
body sans (Segoe UI), numbers mono. Text and bars only; final art direction is
still an operator decision.

## Steps

- [x] 1. Confirm baseline.
  Check: 69 tests pass, build clean, only PLAN.md modified.
  Evidence: `npm test` 69/69, `npm run build` clean, only PLAN.md modified.

- [x] 2. Record Phase 4 decisions in `docs/decisions.md`, then build active play.
  Add `ACTIVE_CLICK_SECONDS = 1.5`. Move per-worker work and shipping into
  `src/engine/work.ts` with a `seconds` argument. `doItYourself(state, workerId)`
  applies 1.5s of that worker's activity, caps build by stock, awards XP by the
  same fraction rules, and ships once after the work. Clicks never add Credits
  trickle, passive Cash or `pendingSeconds`.
  Check: tests cover content, learn, day-job and build clicks; idle, unknown,
  starved and post-win rejection; a click that ships; two builders crossing a
  threshold in one tick still shipping after the loop; the existing suite green.
  Evidence: `tests/active.test.ts` 9 tests; suite 78/78.

- [x] 3. Save v3, storage and the game loop. Add `savedAt` to the save envelope
  and bump `SAVE_VERSION` to 3; v1 and v2 fixtures migrate, with v2 gaining
  `savedAt: 0` (no offline). `loadGame` returns `{ state, savedAt }`. Add
  `src/ui/storage.ts` with a single key, pure `restoreGame(raw, now)` using
  `stepOffline`, `loadStoredGame` and `saveStoredGame`. Add `useGame` with one
  1s clock using real elapsed time, immediate save after restore, 5s autosave,
  pagehide/visibility saves, cloned state for every action and tick, and a save
  status.
  Check: save tests cover the v2 migration, v3 round-trip and savedAt
  validation; storage tests cover 1h/9h/future/corrupt/absent saves, reload and
  a throwing `setItem`; `npm test` green.
  Evidence: save tests 15, storage tests 10, suite 91/91.

- [x] 4. Screen and browser harness. Build the resource bar, crew cards with
  the four activity buttons plus Do it yourself, venture card, hire panel,
  autosave status and minimal win message. Add responsive CSS with 44px
  targets, focus-visible rings, labels, reduced-motion handling and no
  horizontal scroll. Add `playwright-core` and `npm run verify:ui` using
  installed Chrome, screenshots at 1440px and 390px, and checks for assign,
  hire, active play, autosave/reload and overflow.
  Check: `npm run build` clean; `npm run verify:ui` passes and writes both
  screenshots.
  Evidence: build clean; `verify:ui` passed and wrote both screenshots; the
  net-rate addition took the suite to 93/93.

- [x] 5. Browser play and fixes. Review the screenshots against the direction
  note, fix layout or contrast problems in one batch, then rerun. Verify a
  fresh save, a reload that keeps progress, and the venture 2 card after
  venture 1 ships.
  Check: both widths show no banned defaults, no console errors, no horizontal
  scroll; reload preserves progress.
  Evidence: fixed the mobile resource strip and net-rate display; `verify:ui`
  reached `Newsletter` with `1 shipped`, 0 overflow at both widths, 44px minimum
  controls, no console errors; reload kept the hired Creator.

- [x] 6. Document, full checks and commit.
  Check: `npm test`, `npm run build`, `npm run sim` and `npm run verify:ui`
  pass; decisions and spec updated for active play, v3 saves, autosave and the
  provisional art direction; commit author DowntownDX with co-author trailer.
  Evidence: `npm test` 93/93, `npm run build` clean, `npm run sim` stub runs,
  `npm run verify:ui` reached venture 2 with 0 overflow; docs updated.

## Resolved assumptions

- Active play shares `workWorker(seconds)` with ticks, but shipping is separate.
- Click XP uses the current level for the whole 1.5s and levels at the end; it
  is not 1.5 fixed ticks.
- Save timestamps live in the versioned envelope; version 2 saves get
  `savedAt: 0` and therefore no offline.
- React state is always cloned before mutation; the engine mutates in place.
- The game loop owns the clock; nothing else calls `step`.
- Full fresh-to-venture-2 browser play is long at these balance numbers. The
  browser check ships venture 1 and reaches venture 2 with accelerated active
  play; shipping venture 2 stays covered by engine tests until the Phase 8 sim.

## Out of scope

- Side hustle activities, prompt library, skills, team bonuses (Phase 5).
- Automations, audience funnel, follower gates (Phase 6).
- Release clock, subscription upgrades, Edge (Phase 7).
- Welcome-back summary, reset, guide, deploy (Phase 9).
