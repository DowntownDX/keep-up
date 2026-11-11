# Making Keep Up feel alive — research synthesis

Four independent passes: the coordinator's systems/layers review, plus three
DeepSeek V4.1 Flash research passes on game feel, visual identity and
meta/retention. Sources are listed at the end. This document records where they
agree, what each added, what to trim, and the direction Phase 10 follows.

## Where all four agree

- Static numbers are not the product. Layered feedback is: press, float, pulse,
  sound, or a visible change in the world.
- One object must own the screen. Keep Up currently gives the crew, venture,
  release clock, upgrades and hiring roughly equal weight, so the eye has no
  focal point.
- Ambient life has to be budgeted, not constant. Idle screens are watched in the
  background; a single looping detail beats a screen of competing animation.
- The paper/ledger theme is an asset. Diegetic objects — sheets, stamps,
  folders, personnel slips, register rows — beat generic cards.
- Keep Up has no completion surface. Stamps, a ledger and a record of time are
  cheap and fit the theme better than a second currency.
- No fake urgency, punitive streaks or dark patterns. The genre's appeal is low
  pressure.

## What each independent pass added

### Game feel

- The response budget: 0.1s feels direct, 1s breaks flow. Acknowledge a press
  immediately; let the simulation tick resolve the number.
- A click needs a triad, not one channel: squash, particle/float, sound. Cookie
  Clicker's big cookie does all three and lets the player disable them.
- The progress bar is a character. Keep Up's `.progress-fill` retargets a 280ms
  transition every tick, so it chases its own data; a linear animation whose
  duration matches the action interval reads as continuous.
- Magnitude must be re-encoded as size, colour and motion. Pecorella's lemonade
  stand is the better deal but does not *feel* better than the car wash.
- Schedule reasons to look up: golden cookies, threshold multipliers, a rare
  worker opportunity. These are appointments, not constant motion.
- Sound is the cheapest feedback channel, but it needs a toggle and accessible
  alternatives.
- Juice is contextual. Screen shake on every event becomes noise; reserve big
  motion for rare moments.

### Visual identity

- Cookie Clicker arms one object (the only 2× asset is the cookie) and fixes the
  layout zones. Keep Up has seven equal-weight cards.
- Progress must change a place, not just a width: Cookie Clicker's milk rises,
  Grandma's icon changes with wrath. Keep Up's venture bar leaves no mark.
- One catchable event beats constant motion: a golden cookie for 13 seconds, an
  Egg Inc. truck or drone.
- The causal chain must be visible: Idle Miner Tycoon's shaft → elevator →
  warehouse, and AdVenture Capitalist's managers as characters. Keep Up's five
  agents have no visible relationship to the venture they feed.
- Borrowed grammar reads as a game faster: Melvor borrows RuneScape's skill
  language; NGU is consistent and has a mascot. Consistency beats fidelity.
- Motion tiers and NN/g durations: 100ms feedback, 200–300ms substantial,
  500ms feels slow. Animate less often at lower amplitude.
- Locked content should be an object (silhouette or pencil ghost), not a greyed
  button; show at most two locked steps ahead.
- The "Open Ledger" direction: one sheet, layered under-sheets, paper grain, a
  red margin rule, ruled lines, ten line items, personnel slips with monograms
  and a shift dial, stamp presses, a register row for the release timeline, and
  a bottom-third primary action on mobile.

### Meta and retention

- Idle players skew completionist and power-seeking: 70% of surveyed idle
  players called themselves core gamers; Completion and Power were top
  motivators. Keep Up offers Power but no Completion.
- The return moment is the product. A welcome-back panel that says "nothing
  changed" tells the player the world is inert; a dated receipt with itemised
  gains and 2–3 changed things does the opposite.
- Prestige works when the next lap is visibly faster (+50–200% prestige
  currency). Egg Inc.'s 2-hour offline cap was cited as a churn reason; Keep
  Up's 8-hour cap is defensible but should be visible and goal-shaped.
- Goal-gradient and endowed progress: a 12-stamp card with 2 pre-stamped is
  completed faster than a plain 10-stamp card. Never show 0%.
- Daily ritual works but rigidity backfires. Duolingo's streak data shows large
  retention gains and that freezes/slack increase daily activity; breaking a
  streak demotivates.
- Collections are hubs: Neko Atsume's Catbook uses grey silhouettes for
  uncollected cats and pure-vanity mementos. Keep Up already has 10 ventures,
  10 generations and 5 agents as natural sets.
- Social is mostly talk, not systems: 89% of surveyed players talked about the
  game, 78% in person, and sharing earned no reward. A copyable record is
  honest; fake players are not.
- Benchmarks: median PC D1 is ~6.5%, D7 ~1.4%, top-5% D7 ~10.5%. A hobby
  browser game should read single-digit D7 as healthy.

## Where the coordinator would push back or trim

- A full "one sheet" layout is a theme pass, not the first move. The first move
  is feedback, hierarchy and a running record; the sheet redesign can follow.
- A timed "hot lead" and a Do-it-yourself combo change the economy and need
  their own balance tests. Defer them.
- Sound is high value but needs a mute toggle, autoplay handling and test
  coverage. Stage it after the visual pass.
- Streaks, contracts and daily pages are real systems with ethical risk. Only
  add them with slack and no punishment.
- Prestige is out of scope for version 1; the ten-venture ending already exists.

## Five laws for Keep Up

1. **One object owns the screen**: the venture sheet, not seven equal cards.
2. **Every action answers twice**: a press and a visible change somewhere else
   (float, stamp, pulse, or sound).
3. **Show the work**: agents visibly working, a ledger line for each meaningful
   event, and a visible link between a worker and the resource it feeds.
4. **Every set is pre-started**: 1 of 12, first stamp inked, never 0%.
5. **The record is the reward**: stamps and a ledger make time visible without
   adding a second currency.

## Roadmap

- **Phase 10 — feel pass (this plan).** Focal hierarchy, press/feedback
  primitives, worker liveness, ledger feed, stamps, forecasts, ship stamp. No
  economy or save-shape changes.
- **Phase 11 — Open Ledger theme pass.** One-sheet layout, personnel slips,
  register timeline, paper grain, mobile pinned action, sound/haptics, richer
  return receipt.
- **Phase 12 — meta systems.** Contracts, daily page with slack, mastery ranks,
  expanded stamp book; only after the feel pass is played and measured.

## Sources

- Anthony Pecorella, "The Math of Idle Games," Parts I–III, Game Developer,
  2016–2017.
- Anthony Pecorella, "Idle Games: The Mechanics and Monetization of
  Self-Playing Games," GDC 2015.
- Tino van der Kraan, "The recipe behind Cookie Clicker," Game Developer, 2013.
- teemo.dev, "Cookie Clicker: Art Direction & Visual Language" and "Melvor Idle:
  Game Feel & Juice," 2026.
- GameAnalytics / Nate Barker (Kolibri Games), "Making a Hit Idle Game: Eight
  Lessons from Kolibri Games," 2025.
- Steve Swink, *Game Feel* (2008), summarized on Wikipedia.
- The Design Lab, "Making Gameplay Irresistibly Satisfying Using Game Juice,"
  2025.
- Nielsen Norman Group, response-time limits, animation duration and
  progressive disclosure.
- Cookie Clicker Wiki, "Big Cookie" and "Golden Cookie."
- Cutting, Gundry & Cairns, "Busy doing nothing? What do players do in idle
  games?", IJHCS 2019.
- Duolingo streak research, 2020 and 2022.
- Kivetz, Urminsky & Zheng, goal-gradient; Nunes & Drèze, endowed progress.
- Neko Atsume player survey (Cutting et al.) and GameAnalytics benchmarks.
- Keep Up source and shipped bundle (palette, type, transitions, UI).
