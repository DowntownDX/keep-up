# Sequel transition blueprint

Status: planning only. Working decision (2026-11-11): the endless
generator-stack branch becomes a **separate sequel**, not a mode inside Keep Up.
Keep Up is the learning pilot. Revisit only if pilot evidence contradicts the
decision.

## 1. What the decision means

- Keep Up stays a **finite ten-venture game**. No endless state, no prestige,
  no big-number dependency and no mode switch are added to it.
- The sequel is a **new app** with its own engine, save, balance and content. It
  inherits the parts of Keep Up that players actually like — not its full
  economy.
- Keep Up’s job is to prove the fantasy and the feel: a regular person, five AI
  agents, a model-release arms race, ten ventures, a paper/ledger desk. Its
  second job is to produce evidence about which mechanics are worth carrying.
- The sequel can reuse the visual language, the agent cast, the release clock,
  the feedback rules and the testing/simulation process. Code reuse is optional
  and should follow the design, not lead it.

## 2. Why a sequel rather than a retrofit

The pilot is deliberately finite:

- Ten ventures with a hand-tuned build-point table and a win state.
- Five resources and six workers; production is assigned, not bought as
  repeatable generators.
- No prestige, no reset, no meta-currency.
- Native JavaScript numbers; the final simulated state peaks around 1.3e10.
- Save version 6, one key, one run.
- A 30-day sim tuned to the ten-venture targets.

An endless generator stack needs different primitives:

- Repeatable generators with `cost = base × growth^owned`.
- Buy ×1 / ×10 / Max and payback comparisons.
- Milestone multipliers and upgrade tiers.
- A prestige reset with permanent multipliers.
- A number type that survives past 1e308.
- A sim that plays multiple eras, not one campaign.

Retrofitting those into the pilot would touch every formula, test and save path.
A separate app costs less, keeps the pilot trustworthy, and gives the sequel a
clean numeric and save foundation.

## 3. What Keep Up is for

Treat the pilot as a paid learning prototype, even though it is free:

1. **Prove the fantasy.** Does “a regular person keeping up with AI labs” land?
2. **Prove the feel.** Does the desk, the agents, the release clock and the
   venture ships feel alive?
3. **Measure the mechanics.** Which parts do players enjoy, understand and
   remember? Which parts are fiddly or invisible?
4. **Build an audience.** A finished small game is a better sequel runway than
   an unfinished prototype.
5. **Write the design bible.** The sequel should start from evidence, not from
   the pilot’s current implementation.

## 4. Mechanics triage

Nothing is final until playtesting. The table separates what the simulation has
proven from what players still have to prove.

| Mechanic | Current evidence | Likely sequel role |
| --- | --- | --- |
| Paper/ledger identity | Strong visual direction; cheap to extend | **Keep** as the core art direction |
| Agent cast (You, Assistant, Creator, Scout, Tutor, Builder) | Thematic; readable in the UI | **Keep** as managers or specialists |
| Release clock and Edge | Sim shows four fall-behind/catch-up episodes; it is the genre’s strongest differentiator | **Keep**, tested for clarity as a global multiplier/era clock |
| Worker-to-activity assignment | Sim-validated pacing; not yet player-validated | **Test**; likely a secondary layer, not the primary loop |
| Five resources at once | Makes the pilot distinctive but heavy | **Simplify** to two or three in the sequel |
| Automations (50% snapshots) | Sim-validated; thematic | **Keep** as managers/automation |
| Subscription tiers | Sim-validated; cross-resource payoff is hard to read | **Test**; may merge with the release clock or era track |
| Follower gates | Sim-validated pacing; can feel like a wall | **Reshape** as era milestones or soft gates |
| Offline catch-up and return summary | Built and tested; 8h cap | **Keep** |
| Finite ten-venture spine | The pilot’s shape; good for onboarding | **Cut as the endless core**; optionally a short prologue |
| Hand-tuned build-point table | Fit the pilot’s targets; not an endless curve | **Cut**; use generator formulas |
| Active “Do it yourself” click | Built; not yet measured | **Test**; keep as optional active play |
| Next-move hint and guide | Built | **Keep** |
| Stamps, ledger feed, press feedback | Phase 10/11 work; not yet player-tested | **Keep if validated** |
| Pure engine, deterministic sim, versioned saves | Process strength | **Keep the process**, not the code shape |

The sequel should carry **at most two or three** of the pilot’s resource loops.
The rest become flavor, managers or era modifiers.

## 5. Sequel pillars

1. **Endless generator stack.** Repeatable business lines with geometric costs,
   buy amounts, milestones and visible payback.
2. **One primary currency.** Cash/Revenue. Reputation is the prestige currency;
   an optional Research currency can fund one-time upgrades. Do not start with
   five resources.
3. **Prestige as a story beat.** “Sell the studio and start the next era.” Each
   era is a new company with a permanent multiplier and a new modifier.
4. **The arms race remains the differentiator.** Model generations arrive on a
   clock; Edge multiplies Cash. This is Keep Up’s identity and the sequel’s
   pacing device.
5. **Agents become managers.** The five specialists return with one clear
   effect each: cost reduction, content multiplier, demand/unlock, research
   boost, construction multiplier.
6. **The desk is the interface.** Paper, stamps, folders, ledger, personnel
   slips. Avoid generic idle-game chrome.
7. **Big numbers from day one.** Use `break_infinity.js` in the sequel engine;
   the pilot stays on native numbers.

## 6. Sequel economy sketch

- **Generators:** 8–12 business lines, cost growth 1.07–1.15, linear
  production, milestone multipliers at 25/50/100.
- **Upgrades:** one-time multipliers, generator unlocks, manager hires.
- **Prestige:** `Reputation = A × (lifetimeCash / scale)^α`, starting with
  `α = 1/2` or `1/3`. First exit in roughly 90–180 minutes; later eras stretch
  to hours and days.
- **Offline:** 8-hour cap, 100% efficiency, visible receipt, optional auto-buy
  through managers.
- **Notation:** K/M/B/T/Qa and scientific notation as the numbers grow.
- **Content:** data-driven generator/upgrade/era tables, not hand-authored
  one-offs.

The exact formulas should be tuned in the sequel’s own sim, not copied from the
pilot’s table.

## 7. What not to carry

- The ten-venture build-point table as the endless progression.
- Five resources as the primary loop.
- The flat equal-weight card grid.
- Native `number` as the only numeric type.
- The current save shape or the current engine module.
- The pilot’s exact balance numbers. Carry the **lessons** (wall placement,
  gate timing, Edge episodes), not the constants.

## 8. Technical approach

- **New repo and app.** A clean sequel avoids compromise and migration debt.
- **Share design, not code, by default.** Reuse the paper/ledger tokens,
  typography, feedback rules and component patterns. Extract a shared package
  only after the sequel proves the pattern twice.
- **New engine** with a `Decimal`-style type, pure functions, time passed in,
  and no DOM.
- **New save** with its own version; no migration from the pilot.
- **New sim** with a generic buy/prestige policy and a multi-era horizon.
- **Data-driven content** so generator and upgrade additions are rows, not
  code paths.

## 9. Pilot validation gate

Finish the feel pass and the Open Ledger theme pass first. Then playtest with
5–10 people who have not seen the game.

Pre-register the evidence before looking:

- Most testers reach venture 3 without help; a meaningful share finish the ten.
- At least a few return for a second session within a week.
- Most say they would play an endless version.
- They can name a favorite moment and a moment of confusion.
- No fatal confusion about the core loop.

Ask per-mechanic questions, not just “did you like it?”:

- Was assigning workers satisfying or fiddly?
- Did you notice the model releases and Edge?
- What did you want to do first?
- Which moment felt best: a ship, a level-up, an Edge recovery, a return?
- What should the sequel keep, and what should it remove?

Record the answers in a short pilot report. That report is the sequel’s design
brief.

## 10. Staged path

### Stage 0 — pilot validation (now)

- Finish Phase 10 (feel) and Phase 11 (Open Ledger theme, sound, return
  receipt).
- Playtest; write the pilot report.
- Do not add endless code or mode switches to Keep Up.

### Stage 1 — sequel prototype

- New repo/app.
- One currency, six generators, one prestige layer, managers as multipliers.
- Buy ×1 / ×10 / Max; exact bulk cost.
- 30-minute first run; 90–180-minute first prestige.
- A generic sim bot; 30–90 days, multiple eras.
- Minimal paper/desk screen.

Gate: the sim passes the target curve, and five playtesters want a second era.

### Stage 2 — content and meta

- 10–12 generators, milestone multipliers, upgrades, managers, achievements,
  era modifiers.
- Big-number formatting and library.
- Archive, offline auto-buy, richer return receipt.
- Tune the first three eras.

### Stage 3 — ship

- Name, URL and store presence; the pilot can link to it.
- Content cadence and live updates.
- No ads, monetization or backend unless separately decided.

## 11. Decisions needed

1. Sequel name and URL.
2. One currency, or Cash + Reputation + Research?
3. Do the ten ventures become generator types, milestones, or both?
4. Which agents become managers, and what does each change?
5. Prestige fantasy: sell the studio, next era, or model-generation leap?
6. First-prestige target and Reputation exponent.
7. `break_infinity` now, or `break_eternity` later?
8. Does the pilot’s completion grant anything in the sequel?
9. Is the sequel linked from the pilot, or standalone?
10. How much content per era before the next layer?

## 12. Recommendation

Keep Up remains the finite pilot. The endless branch starts as a separate
sequel after the pilot gate, with one primary currency, repeatable generators,
managers, a prestige reset and a big-number type. Carry the paper/ledger
identity, the agent cast, the release clock, the feedback language and the
testing process. Leave the five-resource loop, the ten-venture table and the
pilot’s exact numbers behind.

The pilot’s job is to prove the fantasy and the feel. The sequel’s job is to
prove the generator-stack loop. Keeping them separate is the cheapest way to
learn from both.
