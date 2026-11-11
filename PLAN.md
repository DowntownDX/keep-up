# Phase 10 plan — the feel pass

Goal: make Keep Up feel like a working desk instead of a static form. One focal
object, immediate layered feedback, visibly working agents, a running ledger,
milestone stamps and forecasted progress. No economy or save-shape changes.

Baseline: `npm test` 168/168, `npm run build` clean, `npm run sim` PASS at
`f558824`.

## Steps

- [x] 1. Confirm baseline.
  Check: 168 tests pass, build clean, sim PASS, only `PLAN.md` and the new
  research note differ.
  Evidence: `npm test` 168/168, `npm run build` clean, `npm run sim` PASS at
  `f558824`; no source or test files touched.

- [x] 2. Record the Phase 10 contract and the research synthesis. Add
  `docs/feel-research.md` (four-pass comparison, five laws, roadmap) and one
  Phase 10 section in `docs/decisions.md`: focal object, feedback triad, motion
  budget, derived feed/stamps, no economy changes, sound and the full theme
  pass deferred.
  Check: the research note lists convergence, additions, trims and sources; the
  decisions rows name the direction and the deferred work.
  Evidence: `docs/feel-research.md` added with the four-pass comparison, five
  laws and roadmap; Phase 10 rows added to `docs/decisions.md`; source and test
  files still untouched.

- [x] 3. Focal hierarchy and paper foundation: move `VentureCard` and
  `NextMove` into one focus row above the board; make the venture the hero
  sheet with paper grain, a ruled background, a margin rule and a hard offset
  shadow; reduce the masthead scale so the sheet wins. Keep the side rail for
  release, upgrades, hiring and stamps.
  Check: `npm run build` clean; desktop and mobile screenshots show the venture
  before the crew on mobile and one clear focal object; `verify:ui` still
  passes with 0 overflow.
  Evidence: build clean; `verify:ui` 0 overflow at 1440 and 390, minButton 44;
  `npm test` 168/168; `npm run sim` PASS. Measured at 390: venture top 330 <
  crew top 774, `.side .venture` 0, one `#venture-title`, h1 28px against a
  33.6px venture title. At 1440 the hero and crew are both 682px wide.

- [x] 4. Feedback primitives: add an action tick in `useGame`, `:active`
  press states, a short resource-strip flash on every action, and a `WORKED`
  stamp on the worker card after Do it yourself. Respect
  `prefers-reduced-motion`.
  Check: build clean; a click changes the button, the worker card and the
  resource strip; reduced-motion CSS removes transforms and animation.
  Evidence: `npm test` 168/168; `npm run build` clean; `npm run sim` PASS;
  `npm run verify:ui` 0 overflow at 1440 and 390, minButton 44. The browser
  check measured `pressTransform` `matrix(1, 0, 0, 1, 0, 1)`, `WORKED` and
  `.resource-row.is-flashing` present after a DIY click and gone within the
  timeout, and under reduced motion `reducedPress`, `stampTransform`,
  `stampAnimation` and `flashAnimation` all `none`. The colour flash stays in
  reduced motion as non-motion feedback. A same-activity assign no longer
  ticks and reset clears the tick.

- [x] 5. Worker liveness: add a small CSS monogram `AgentMark` per worker kind
  (no hand-built SVG set), a working/idle live dot, and a live output chip
  (`+1.2 Followers/s`, `+1.2 pts/s`, `+0.3 Leads/s`). Idle workers say
  "Waiting for a task".
  Check: every kind renders its monogram and state; a working card shows a
  pulsing dot and rate; an idle card shows the waiting state; build clean.
  Evidence: `npm test` 181/181 (13 new `workerOutput`, monogram and stall
  tests); `npm run build` clean; `npm run verify:ui` six-kind seed renders marks
  `YACSTB`, all six cards `working`, chips `+0.12 Followers/s`,
  `+1.25 Cash/s`, `+0.16 Followers/s`, `+0.16 Leads/s`, `+0.44 Know-how/s`,
  `+1.6 pts/s`, each bound to its kind; fresh mobile card shows
  `Waiting for a task` with no pulse; the gated builder says
  `Needs 1.1M Followers`; a stalled client worker with no leads and no lead
  source shows `Needs Leads`, a steady dot and a disabled DIY button; a working
  dot runs `worker-pulse`; reduced motion sets the dot animation to `none`;
  0 overflow and minButton 44 at 1440 and 390. Client work is labelled Leads/s
  because the engine rate is Leads handled, and day-job Cash includes Edge so
  the chip matches the strip. Stall detection checks each zero-stock leg
  separately: stock still covers the work with no refill, and a live trickle
  still covers it at zero stock, so a builder at 0 Credits with 100 Know-how
  keeps working and does not blink. `npm run sim` PASS.

- [x] 6. Ledger feed and stamps: add pure `src/ui/events.ts` (state diff to
  events for ventures, level-ups, hires, upgrades, subscription, automation
  and releases), `useEventLog`, a `LedgerFeed` strip, and derived
  `src/ui/stamps.ts` plus a `StampBook` card. Tests cover each event kind, no
  events on an identical state (mount), one aggregate line for a multi-venture
  tick, reset clearing, stamp thresholds and the feed cap. The feed must not
  duplicate on a React StrictMode mount.
  Check: `npm test -- events stamps` green; the feed shows the venture-1 ship
  and level-ups; the stamp book shows earned and locked stamps; build clean.
  Evidence: `npm test -- events stamps` 20/20; `npm test` 201/201; build clean;
  `npm run sim` PASS. `npm run verify:ui` found the ledger empty and the book
  at 0 of 8 on load, recorded `Shipped Prompt pack` after the first ship with
  `First ship` earned and `Five ventures` locked, kept the ledger empty after a
  reload (no StrictMode replay), showed the `Learn` level-up, added exactly one
  line for the Skills purchase (`Skills level 1`), and cleared the ledger and
  book on reset; 0 overflow and minButton 44 at 1440 and 390. The feed keeps 6
  newest entries and drops the oldest; ids are a monotonic counter, so two
  workers levelling the same skill in one tick keep distinct keys. Stamps are
  derived from current state and return to locked on reset. A reset token is a
  pure `reduceFeed` input, so a reset before the clock moves clears the feed;
  a unit test covers that case.

- [x] 7. Forecasts and celebration: add pure `src/ui/forecast.ts` with a
  resource-capped venture ETA (min of build rate, Credit rate per point and
  Know-how rate per point; null when gated, won or starved), time-to-afford and
  Prompt/Skills before/after. Label the ETA "about"; caps, gates and stocks
  mean a finite ETA is an estimate, so the label carries the uncertainty. Show
  it on the venture card, show the upgrade preview and afford time on the
  upgrade tabs, and add a transient `SHIPPED` stamp when a venture ships. Tests
  cover the capped ETA, gate/won/zero-rate nulls, afford edge cases and the
  preview.
  Check: `npm test -- forecast` green; the venture card shows an ETA; the
  upgrade card shows now → next; a ship shows the stamp; build clean.
  Evidence: `npm test -- forecast` 14/14; `npm test` 215/215; build clean;
  `npm run sim` PASS. `npm run verify:ui` forecast seed shows `About 1h 5m to
  ship`, Prompt `Now +0% → next +8%` and Skills `+0% → next +10%`, both
  `Affordable now`; the first ship shows `SHIPPED` then clears, and a reload
  does not replay it; mobile shows `No ETA yet`/the preview with 0 overflow and
  minButton 44. The ETA is the slowest of the build, Credit and Know-how legs,
  computed from stock plus live supply, so a positive stock covers a leg with
  no refill. Credit supply subtracts client-work burn; a builder with a client
  worker that eats the whole trickle and no stock shows no ETA. It is null when
  gated, won, no one builds, or a leg cannot finish. Afford time uses gross
  production (a builder can be paused); preview values are cumulative bonus
  shares and are not clamped at 100%.

- [x] 8. Verify, document, commit and deploy: extend `verify:ui` for the focus
  order, ledger feed, stamps, worker live state, venture ETA and upgrade
  preview; update `docs/spec.md`; mark this plan complete with evidence; run
  `npm test`, `npm run build`, `npm run sim`, `npm run verify:ui` and
  `npm run verify:preview`; commit as DowntownDX with the DeepSeek V4.1 Flash
  co-author trailer and push, then re-check the public URL at 390px.
  Check: all five commands pass; the public URL serves the new build; working
  tree clean.
  Evidence: `docs/spec.md` has the Phase 10 section; `verify:ui` covers the
  focus order (venture before crew at 390, no venture in the side), ledger and
  stamps on load/reload/ship/reset, worker live and stalled states, the ETA and
  both upgrade previews, no ETA when gated, and the SHIPPED stamp on the first
  and tenth ships. `npm test` 215/215; `npm run build` clean; `npm run sim`
  PASS; `npm run verify:ui` 73.7s PASS; `npm run verify:preview` 75.1s PASS.
  Committed as `b3e1106` with the co-author trailer and pushed to `main`;
  deploy workflow `43056044411` succeeded. The public URL at 390px serves
  `assets/index-XnCyBmOE.js`, the Phase 10 bundle: 0 overflow, venture top 330
  < crew top 797, one ledger and one stamp book, no console or page errors.
  The tree is clean except the untracked operator files (`AGENTS.md`,
  `HANDOFF.md`, `idleon-bible.md`, `idle-game-math-and-balance.md`,
  `opencode.json`, `.opencode/`), which are deliberately not touched.

## Resolved assumptions

- No engine, balance or save-shape changes. The pass is presentation and UI
  state only.
- The ledger feed is derived by diffing consecutive states, not persisted; a
  reset clears it.
- Stamps are derived from current state, not persisted; they return as the
  player re-earns them. A per-run stamp archive waits for a meta phase.
- Forecasts are estimates at the current rates and are labelled "about"; they
  never mutate state.
- Sound, haptics, the full Open Ledger sheet layout and the return-receipt
  upgrade wait for Phase 11.
- Contracts, daily pages and streaks wait for Phase 12 and need slack, not
  punishment.
- Motion respects `prefers-reduced-motion`; no autoplay audio is added.

## Out of scope

- New currencies, prestige, achievements with rewards, social features.
- Economy tuning or save migrations.
- A commissioned art pass.
- The endless sequel. Keep Up stays finite; see `docs/endless-transition.md`.
