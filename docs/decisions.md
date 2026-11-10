# Decisions

One row per implementation decision that is not already fixed by
`docs/spec.md`. Grouped by build phase, oldest first. Add a row before building
on a decision.

All Phase 0-3 decisions were made on 2026-11-10.

## Phase 0 — scaffold

| Decision | Why |
| --- | --- |
| Repo root is `C:\dev\keepup`; no nested `keep-up/` folder. | The folder already held the build plan; a nested root would add a level for no benefit. |
| Vite 7, React 19, TypeScript strict, Vitest 3, `tsx` for the sim entry. | The build plan's stack. `tsx` runs the headless sim without a build step. |
| Scripts: `dev`, `build`, `test`, `sim`, `preview`. `build` runs `tsc --noEmit` first. | One command per plan check, and type errors fail before Vite. |
| No ESLint or Prettier yet. | Not in the plan; `tsc` and the unit tests are the current guards. |
| `App` is a placeholder; no game code in the UI. | Phase 0 only proves the scaffold. |
| Vitest runs in the node environment; the only UI test imports `App`. | No DOM is needed until Phase 4, which keeps the test setup small. |

## Phase 1 — core engine

| Decision | Why |
| --- | --- |
| The player starts alone and idle, with no activity selected. | The spec says "starts alone" but not which activity; idle lets the player choose. |
| Each agent kind can be hired once; the five kinds fill the five seats. | The worker table lists exactly five specialists and the cap is five. |
| Skill bonus is additive: `1 + 0.12 x (level - 1)`. | The spec's "+12% per level above 1" reads additive; compounding would outrun the curve. |
| XP is seconds of work, with each level needing 1.25x the last. | Matches "15 seconds of work, growing 1.25x per level". |
| The engine advances in fixed one-second ticks and banks the remainder in `pendingSeconds`. | Makes long and short steps agree and keeps later offline catch-up independent of frame rate. |
| `ACTIVITIES` contains only implemented activities; `assignActivity` rejects the rest. | Keeps later systems from leaking into play before their phase. |
| Every worker has skills for all six activity ids, including unimplemented ones. | Avoids changing the save shape when Phase 5 adds activities. |
| `MAX_AGENTS` derives from `AGENT_KINDS.length`. | Removes duplicated truth found in the Phase 1 rework review. |
| Tests pin concrete balance results, such as 60s of content giving 82.512 Followers. | Keeps integration behavior honest; Phase 8 updates them with the config changes. |

## Phase 2 — ventures

| Decision | Why |
| --- | --- |
| Shipping is automatic; there is no Ship button. | The spec lists no ship action, and idle progress should resolve itself. |
| Overflow points carry into the next venture; one tick can ship more than one. | Avoids wasting points at a threshold. |
| Build XP accrues by the fraction of the tick actually worked, not per point. | Points scale with skill level, so per-point XP would compound leveling. |
| Build points use the same worker specialty and skill multipliers as other activities. | One rate function keeps bonuses consistent; the spec's 1 point/s is the base before the You 1.2x. |
| Credits trickle lands before the tick's build burn is checked. | A builder with zero Credits can use that tick's trickle. |
| Passive Cash starts on the tick after a venture ships. | Shipping runs after the worker loop, so income cannot be paid for the tick that shipped. |
| Building is inert after the tenth venture ships. | Prevents indexing past the venture list and marks the win state. |
| `resourceRates` reports gross production only. | Build burn is stock-capped, not a rate; the UI shows stock separately. |
| Follower gates on ventures 6-10 are deferred to Phase 6. | Phase 6 owns the gate; auto-ship must then stop at a gated venture. |
| Passive Cash must pass through Edge in Phase 7. | The spec says Edge multiplies all Cash; shipped ventures must not dodge it. |
| Venture state joined the first save format; no migration was needed then. | Phase 3 had not shipped persistence yet. |

## Phase 3 — save and offline

| Decision | Why |
| --- | --- |
| Saves are an envelope of `{ version, state }`; current version is 2. | Keeps metadata out of the game state and leaves room for future fields. |
| Version 1 is the Phase 1 state shape; a literal fixture migrates it by adding zeroed venture fields. | Gives the migration a fixed target that cannot drift with current code. |
| A failed load returns `null`. Absent and corrupt saves are not distinguished yet. | Phase 4's storage layer decides whether to start fresh or warn. |
| Validation rejects impossible states instead of repairing them. | A save with `pendingSeconds >= 1` would otherwise hang the first step. |
| Validation covers resources, one You, unique ids and kinds, all six skills, activities, counters, pending time and venture progress. | A save must not crash, hang or auto-ship on load. |
| No subscription tier cap in validation. | Phase 7 defines the real tier ceiling. |
| Offline is capped at eight hours and runs at full speed. | Matches the "While you sleep" system in the spec. |
| `stepOffline` has no separate chunk loop. | `step` already advances in fixed one-second ticks, and 28,800 ticks finish in milliseconds. |
| Non-positive or non-finite elapsed time is ignored. | Wall clocks can move backwards; an infinite value is corrupt input. |
| `save.ts` stays pure; localStorage and autosave are Phase 4. | The engine must not touch browser APIs. |

## Cross-phase process

| Decision | Why |
| --- | --- |
| Start every phase with `ds-plan-loop`: write `PLAN.md`, get one fresh-context critique, execute one checked step at a time. | Operator instruction; recorded in `CLAUDE.md`. |
| After the plan, check which ds skills fit the phase and load them before writing code. | Operator instruction; keeps design, TDD and verification skills in play from the start. |
| Commit author is DowntownDX; each commit carries a DeepSeek V4.1 Flash co-author trailer. | Operator instruction. |
| Balance tuning is deferred to Phase 8; `balance-log.md` stays empty until then. | Current numbers are the spec's untested first draft. |
| `npm run sim` stays a stub until Phase 8. | The bot and pacing run are Phase 8 work. |

## Still open

- Phase 5: find clients, client work, prompt library, skills, team bonuses.
- Phase 6: follower gates, automations, audience funnel.
- Phase 7: release clock, subscription tiers, Edge, tier cap.
- Phase 8: sim bot, pacing, balance log.
- Phase 9: polish, reset, guide, deploy.
- Operator decisions from the build plan: name, fictional labs, quitting the day
  job, art direction, static host, offline cap as an upgrade.
