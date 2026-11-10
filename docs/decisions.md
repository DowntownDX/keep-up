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

## Phase 4 — playable screen

| Decision | Why |
| --- | --- |
| Provisional ledger art direction: warm paper, ink, one burnt-orange action color, display serif with body sans, text and bars only. | Phase 4 needs a screen; the final art direction remains an operator decision and this direction needs no assets. |
| Do it yourself is a button on each worker card. | The spec says one worker's activity; putting it on the worker makes the target unambiguous. |
| Active play applies 1.5s through the same work function as a tick, without Credits trickle, passive Cash or `pendingSeconds`. | One formula avoids drift; a click is worker work, not global time. |
| A click ships completed ventures once, after the work, never inside a per-worker loop. | Keeps the Phase 2 ship-after-loop rule and prevents later builders feeding the next venture. |
| Save envelope moves to version 3 with a `savedAt` timestamp; version 2 migrates with `savedAt: 0`, meaning no offline. | One self-contained save format; no localStorage wrapper or phantom legacy format. |
| Offline is applied silently on load; the welcome-back summary waits for Phase 9. | Keeps Phase 4 focused; the engine already has the cap and catch-up. |
| Autosave every 5s, plus pagehide and visibility change; a failed write is shown, not hidden. | A debounce alone can starve during continuous ticks; a fixed interval guarantees writes. |
| One clock owner: a 1s interval using real elapsed time, capped at 8h. | Avoids interval drift and double-stepping from extra timers. |
| Only the four implemented activities are rendered. | No dead buttons for find clients or client work. |
| The resource bar shows net rates, subtracting the build burn workers are trying to spend. | A gross rate would show +1/s Credits while the stock falls; the sim keeps using gross `resourceRates`. |
| Browser verification uses `playwright-core` with installed Chrome at 1440px and 390px. | The in-app browser tools are unavailable; this checks layout, clicks and reload without downloading a browser. |
| Win state is a short message; polish waits for Phase 9. | It is unreachable in a venture-2 verification run and not part of this phase's polish. |

## Phase 5 — side hustle and upgrades

| Decision | Why |
| --- | --- |
| Find clients and Client work unlock after venture 1 ships. | Matches the activity table's "Venture 1" column. |
| Client work handles 0.2 Leads/s per base worker rate, burning 5 Credits and paying 8 Cash per Lead, capped by both stocks. | Straight from the balance table; the cap makes starvation testable. |
| Client work base output is Leads handled, not Cash. Cash is `handled x 8` after one multiplier pass. | One field cannot express both; this keeps multipliers from applying twice. |
| A saved worker on a locked activity is invalid. | Otherwise a hand-edited or stale save bypasses the venture-1 gate. |
| Prompt skips Cash-producing activities (day job, Client work); Skills skips Learn. Both apply to build points. | The payment resource must not fund a boost to itself. |
| Prompt library costs Cash: base 25, growing 1.5x per level. Each level adds 8% to non-Cash output (content, learn, find clients, build). | The operator-approved model; paid in Cash, so it must not boost Cash output. |
| Skills cost Know-how: base 10, growing 1.6x per level. Each level adds 10% to non-Know-how output (day job, content, find clients, client work, build). | The operator-approved model; paid in Know-how, so it must not boost Learn. |
| Prompt, Skills, specialty and per-worker skill multipliers multiply together. | Each system should feel additive in its own right without replacing the others. |
| Team bonus is +0.5% per specialist level above 1, applied to that specialty's activity for every worker. Assistant contributes to both specialties. | Level 1 is the baseline; "for everyone" includes the specialist. |
| Save version 4 adds `promptLevel` and `skillsLevel`; version 3 migrates with both at zero. | Save shape change; migration and tests are mandatory. |
| Prompt library and Skills live in a tabbed upgrade card; locked activities stay visible and disabled with an unlock note. | Players can see what is coming without dead buttons that silently do nothing. |
| Buying an upgrade returns false and changes nothing when the cost is unaffordable. | Same guard style as hiring and assigning. |

## Phase 6 — automations, audience and gates

| Decision | Why |
| --- | --- |
| Automations unlock after venture 2; one per agent kind, stored on that worker, not You. Re-recording replaces it. | Structural one-per-agent; no separate lookup table. |
| The snapshot is 50% of the worker's output at record time, including current multipliers, then fixed forever. | "Snapshot" means later upgrades must not silently raise it. |
| Automations hold no worker slot and earn no XP. | The worker is free to move; the automation is not a second worker. |
| Build and Client work automations still burn their resources, stock-capped. | Otherwise an automation would print free progress or Cash. |
| Ticks run Credits, passive Cash, audience funnel Leads, workers, automations, then shipping. | Fresh Leads can fund Client work in the same tick; one ship point per tick. |
| Audience funnel unlocks after venture 3: 1 Lead/s per 2,000 Followers, not consuming Followers. | Straight from the balance table; Followers are never spent. |
| Follower gates start at venture 6 with 5,000, growing 6x per venture. Build progress, burn, automation output and shipping are blocked until the count is met. | "Cannot launch" means the venture cannot start; blocking only the ship would let points bank for free. |
| Overflow that lands on a gated venture is discarded. | Banking it would effectively launch the venture without the Follower count. |
| Save version 5 adds `worker.automation`; version 4 migrates every worker to null. | Save shape change; migration and validation are mandatory. |
| Agent cards get a Record/Update automation control once the system unlocks; the venture card and Build buttons show the Follower gate. | Players need to see why building is blocked. |

## Phase 7 — release clock, subscriptions and Edge

| Decision | Why |
| --- | --- |
| The release clock is game time in `state.elapsedSeconds`, advanced once per tick before production. Clicks and the screen never advance it. | Keeps the engine pure; a release that lands on a tick sets Edge for that same tick's production. |
| Generation 1 is out at zero, generation 2 at 150 seconds, each later interval 3x longer, ten generations in total. | Straight from the spec's release table; the schedule derives from the base, growth and count instead of ten literals. |
| Edge multiplies Cash earned only: day job, Client work payout, cash automations and passive venture income. It does not scale spend, the starting stock or other resources. | The spec says Edge multiplies all Cash you earn; applying it to costs would make upgrading self-defeating. |
| `cashGain(state, amount)` in `releases.ts` is the one Edge multiplier; `resourceRates` and the venture card use it too. | Displayed and paid Cash cannot drift when there is one multiplier point. |
| Client work still handles Leads by volume and burns 5 Credits per Lead; Edge raises only the Cash paid per Lead, and XP uses handled volume. | Scaling the handled volume would mint free Leads and Credits and pay bonus XP. |
| Automation snapshots stay in activity units and exclude Edge; Edge scales the Cash when the automation runs. | Re-recording must not freeze the multiplier, and a fixed snapshot must not bake it in. |
| The free starting subscription is generation 1, the latest at time zero, so a fresh game earns 1.5x Edge. Existing Cash expectations shift by 1.5x. | "1.5x on the latest model"; Phase 8 re-tunes the resulting balance. |
| A subscription can only rise to a released generation. Cost is 50 Cash times 6 per tier, and tier ten is the cap. | A release does nothing until paid for; ten generations means ten tiers. |
| Save version 6 adds `elapsedSeconds`; version 5 migrates at the saved tier's release time. | Save shape change; migration and tests are mandatory, and an existing tier must stay valid. |
| Validation rejects negative or non-finite elapsed time, a tier above the latest release and a tier above ten. | A tier ahead of the clock or past the model count is impossible. |
| The timeline and news feed name generations, not labs. | Lab names remain an open operator decision. |
| The release card sits after the venture card in the side column. | The arms race is the second global system and belongs next to venture progress. |

## Phase 8 — sim bot, pacing and balance

| Decision | Why |
| --- | --- |
| The bot plays idle: no Do it yourself clicks, continuous game time for thirty days, decisions every five seconds. | The targets describe a player who checks in a few times a day; clicks would measure active play instead. |
| Hiring order is Tutor, Creator, Builder, Assistant, Scout. The Tutor learns, the Creator makes content, the Builder builds or learns, the Assistant takes Cash work, and the Scout finds clients. | Covers every burn before building: Know-how first, then build speed, then Cash and Leads. |
| The bot upgrades the subscription when a release is out and Cash allows, buys the cheaper affordable upgrade only above a reserve, and records automations once plus when the live rate is 1.5x the snapshot. | Simple rules that neither starve a build nor freeze forever at an old snapshot. |
| A fall-behind episode starts when Edge drops below 1.5 and ends when it returns to 1.5. | Gives the "fall behind at least twice and catch up" target a countable definition. |
| "First Follower gate" is the first tick where the current gated venture has enough Followers to launch. | Measures the gate doing its job, not just the venture count. |
| The Edge-pinning check stops before generation 10, which arrives on day 17. | After the last release, staying at 1.5 is the correct end state, not a balance failure. |
| Every pacing target range lives in `src/sim/targets.ts` and is shared by the CLI and tests. | One source of truth; the check cannot drift from the test. |
| `npm run sim` prints milestones and PASS/FAIL per target, accepts `--days` and `--json`, and exits nonzero on a miss. | Makes the phase a deterministic check instead of a demo. |
| Balance changes live in `config.ts`; pinned test numbers follow the tune and are never weakened. | The rules stay fixed while the numbers move; tests keep proving the same relationships. |
| `docs/balance-log.md` gets one entry per tuning round: what changed, the run that justified it, and the result. | Keeps every number traceable to a measurement. |
| Build points are a tuned ten-value table: 260, 1,000, 4,700, 14,190, 46,830, 154,540, 510,000, 1,683,000, 5,555,000 and 18,330,000. | A flat 5x growth made venture 10 unreachable; a steeper early slope and a flatter tail hit the early targets and the 2-3 week finish. |
| Build burn is 1 Credit and 0.05 Know-how per point. | At 0.2 Know-how per point the last venture needed more Know-how than the Learn activity could make in weeks. |
| Make content makes 0.1 Followers per second at base. | At 1 per second the 5,000 Follower gate was always cleared before venture 6; the slower rate makes Followers a deliberate investment. |
| Follower gates are 1,150,000 at venture 6, growing 1.8x per venture. | Puts the first gate on day 2 and keeps later gates inside the content curve instead of outrunning it. |
| Seat costs are 40, 800, 12,000, 120,000 and 1,200,000 Cash. | The old second and third seats arrived so early that the Builder erased the middle-game targets. |
| Subscription upgrades follow the table 25, 500, 15,000, 300,000, 6M, 60M, 300M, 1B and 3B Cash. | Early upgrades must be a real choice so the player can fall behind; late prices must stay reachable with passive income. These rows supersede the first-draft build, seat, gate and subscription numbers in Phases 2, 6 and 7. |

## Still open

- Phase 9: polish, reset, guide, deploy.
- Operator decisions from the build plan: name, fictional labs, quitting the day
  job, art direction, static host, offline cap as an upgrade.
