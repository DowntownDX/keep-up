# Phase 9 plan — polish and ship

Goal: a new player can start with no instructions, sees a next-move hint and a
guide, gets a welcome-back summary after time away, can reset with confirmation,
and the production build is deploy-ready and verified at phone width.

Baseline: `npm test` 153/153, `npm run build` clean, `npm run sim` PASS at
`3054a6a`.

## Steps

- [x] 1. Confirm baseline.
  Check: 153 tests pass, build clean, sim PASS, only `PLAN.md` differs.
  Evidence: `npm test` 153/153, `npm run build` clean, `npm run sim` PASS at
  `3054a6a`; only `PLAN.md` modified.

- [x] 2. Record the Phase 9 contract in `docs/decisions.md`: offline summary
  fields and cap, hint order, reset scope, guide content, and the deploy
  position (host choice remains an operator decision, so no publish).
  Check: one Phase 9 section lists those decisions; no code touched.
  Evidence: Phase 9 section added; `Still open` lists only operator decisions.

- [x] 3. Offline report: add `restoreGameWithReport` and
  `loadStoredGameWithReport` in `src/ui/storage.ts` with elapsed time, capped
  flag, per-resource gains and ventures shipped; keep `restoreGame` as the
  state-only wrapper. Add `clearStoredGame` and `removeItem` on `StorageLike`.
  Tests cover one hour of gains, the eight-hour cap, zero timestamp, corrupt
  save, an absent save, a clock behind the save, a near-zero gap and the clear.
  Check: `npm test -- storage` green; every no-gain case returns a null summary.
  Evidence: storage 15/15 green, including 1h gains, 8h cap, absent/corrupt/
  zero/behind/near-zero gaps and the clear.

- [x] 4. Hints: add a pure `src/ui/hints.ts` with ordered rules (all idle,
  hire, gate, build, subscription, automation, upgrade, default) and
  `tests/hints.test.ts` pinning each branch.
  Check: `npm test -- hints` green.
  Evidence: hints 10/10 green.

- [x] 5. Screen: add `WelcomeBack` (dismissible summary), `NextMove` (hint
  card), and `GuideCard` (How to play / Your data tabs with a two-step reset
  confirmation). Wire `offline`, `dismissOffline` and `reset` through `useGame`
  and `Game`; add CSS that matches the ledger style. The data tab states that
  clearing site data erases it.
  Check: `npm run build` clean; desktop and mobile screenshots show the three
  new sections with no overflow; the guide and reset controls are reachable at
  390px.
  Evidence: build clean; `artifacts/desktop.png`, `artifacts/mobile.png` and
  `artifacts/welcome.png` show the cards; 0 overflow; guide/reset reachable at
  390px.

- [x] 6. Browser check: extend `verify:ui` to assert the hint, the guide tabs,
  reset cancel and reset confirm, and a welcome-back summary seeded with an old
  timestamp in its own browser context so it cannot disturb the main flow.
  Dismiss the summary and assert it disappears. Add the new controls to the
  mobile checks and keep every existing check. Re-run screenshots.
  Check: `npm run verify:ui` passes with the new assertions and 0 overflow at
  both widths.
  Evidence: `npm run verify:ui` passed: hint `start`, reset cancel+confirm,
  offline summary "1h of work" dismissed, guide tabs on desktop and mobile,
  44px minimum buttons and 0 overflow at both widths.

- [x] 7. Deploy preparation: add `docs/deploy.md` with the static-host steps
  and the host-choice note; teach `verify:ui` a `--preview` flag that serves
  the built `dist` through `vite preview` instead of the dev server, and add
  `npm run verify:preview` as build plus that run. Do not publish: no host was
  chosen and no push or external action is authorized.
  Check: `npm run verify:preview` passes; the doc names the open host decision.
  Evidence: `npm run verify:preview` built `dist/` and passed the full browser
  check through `vite preview`; `docs/deploy.md` names the open host choice.

- [x] 8. Final pass: update `docs/spec.md` with the Phase 9 additions, mark
  this plan complete with evidence, run `npm test`, `npm run build`,
  `npm run sim`, `npm run verify:ui` and `npm run verify:preview`, then commit
  as DowntownDX with the DeepSeek V4.1 Flash co-author trailer.
  Check: all five commands pass, `git status` clean, commit message names
  Phase 9.
  Evidence: `npm test` 168/168, `npm run build` clean, `npm run sim` PASS,
  `npm run verify:ui` and `npm run verify:preview` PASS with 0 overflow and
  44px buttons; committed as `Phase 9: polish and ship`.

- [ ] 9. Publish to GitHub Pages: add the relative Vite base and the Pages
  workflow, create the public `DowntownDX/keep-up` repository, enable Pages
  with the workflow build type, then open the public URL at 390px and confirm
  the page and a save/reload.
  Check: the workflow run is green and the public URL serves the game on a
  phone-width viewport.

## Resolved assumptions

- The welcome-back summary is per page load and dismissible; it reports only
  what the offline step actually produced, capped at eight hours.
- Hints are deterministic UI text, not engine rules; they never change state.
- Reset clears only `keep-up.save`, asks first and starts a fresh game; it does
  not clear anything else.
- The guide is static copy and adds no new mechanics.
- "Deploy" means a production build that a static host can serve; publishing
  needs the operator's host choice and credentials, so this phase stops at a
  verified preview and a deploy note.
- The ledger style, strict CSP-free local build and phone layout stay as they
  are.

## Out of scope

- Real hosting accounts, analytics, ads, accounts or cloud saves.
- New game systems or balance changes.
