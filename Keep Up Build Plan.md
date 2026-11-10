# Keep Up Build Plan

Nov 10, 2026 · @Paul

## Overview

Keep Up is a browser idle game where you play a regular person using AI to get ahead. You hold a day job, run a side hustle and grow a social media presence, all at the same time. In the background, AI labs release stronger models on a clock, and you have to keep up.

It borrows IdleOn's structure. You and your AI agents each work one activity at a time, there are always more activities than workers, and what one worker makes strengthens the others.

Version 1 is single-player, runs entirely in the browser, and saves locally. It has no accounts, no server, no payments and no ads. That keeps it small enough for a coding agent to build in about ten short phases.

How to use this plan with a coding agent:

- Give the agent one phase at a time, using the prompt template in Build phases.
- Do not start the next phase until the current one passes its checks and is committed.
- Keep the game rules in a pure engine with no screen code. The agent can then test the rules by itself without opening a browser.
- Keep every balance number in one file, so tuning never touches logic.

&#91;embedded content: resource loop · 4 activities and a subscription, 5 resources, 4 sinks\]

Read the diagram left to right, then follow the return arrow. Client work also burns Credits, and Skills are bought with Know-how, which the picture leaves out.

MBA concept, minimum viable product (MVP): ship the smallest version that tests whether players enjoy the core loop, then spend money and time only on what the evidence supports. Version 1 here is the MVP. Monetization waits until people play it.

## Game design spec

The player is one regular person plus the AI agents they add. Each worker does one activity at a time, across three tracks that run side by side: the day job, the side hustle and content.

### Resources

| Resource | Comes from | Used for |
| --- | --- | --- |
| Cash | Day job tasks, Client work, shipped ventures | Agent seats, subscription upgrades, prompt library |
| Followers | Make content | Never spent. They bring in Leads over time and gate the launch of ventures 6 to 10 |
| Leads | Find clients, plus a trickle from Followers | Client work |
| Know-how | Learn | Skills, building ventures |
| Credits | Your AI subscription, a steady trickle that needs no worker | Client work, building ventures |

### Activities

| Activity | Track | Makes | Burns | Opens |
| --- | --- | --- | --- | --- |
| Day job tasks | Day job | Cash, steady | Nothing | Start |
| Make content | Content | Followers | Nothing | Start |
| Learn | All three | Know-how | Nothing | Start |
| Build venture | Side hustle | Venture progress | Credits and Know-how | Start |
| Find clients | Side hustle | Leads | Nothing | Venture 1 |
| Client work | Side hustle | Cash, high | Leads and Credits | Venture 1 |

### Workers

- The player starts alone and can add up to five AI agents with Cash.
- Each worker does exactly one activity. Each activity has its own skill level per worker, which rises only while they do it.
- Levels are kept when a worker switches activities.

| Worker | Bonus |
| --- | --- |
| You | 1.2x at every activity |
| Assistant agent | 1.6x at Day job tasks and Client work |
| Creator agent | 1.6x at Make content |
| Scout agent | 1.6x at Find clients |
| Tutor agent | 1.6x at Learn |
| Builder agent | 1.6x at Build venture |

### Ventures

Ventures are the game's bosses. Building one burns Credits and Know-how for every build point. Shipping one pays passive Cash forever and unlocks the next system. The ten ventures in order: Prompt pack, Newsletter, Template shop, Faceless video channel, Online course, Browser extension, Mobile app, Micro SaaS, Automation agency, Product portfolio. Shipping the tenth wins the game: your income no longer depends on the day job.

### The arms race in the background

AI labs release a new model generation on a clock, ten in total. A release does nothing for you until you pay Cash to upgrade your subscription to it. Each upgrade raises your Credits trickle.

Your Edge is how close your tools are to the latest release, and it multiplies all Cash you earn: 1.5x on the latest model, 1.25x one behind, 1.1x two behind, 1x three behind, 0.9x four or more behind. Everyone else gets the new models too, so standing still means falling behind.

### Systems and when they unlock

| System | IdleOn equivalent | Unlocks after | What it does |
| --- | --- | --- | --- |
| Prompt library | Stamps | Start | Permanent bonuses for all workers, paid in a different resource than the one boosted |
| Skills | Alchemy bubbles | Venture 1 | Know-how buys bonuses for every worker |
| Automations | 3D printer samples | Venture 2 | Snapshot a worker's output at 50%, then it runs forever without them |
| Audience funnel | Refinery | Venture 3 | Followers turn into Leads on their own; ventures 6 to 10 need a Follower count to launch |
| Team bonuses | Family bonuses | Start | Each specialist level adds 0.5% to that activity for everyone |
| While you sleep | AFK gains | Start | Agents keep working for up to 8 hours while the game is closed |
| Do it yourself | Active play | Start | A click does 1.5 seconds of one worker's activity |
| Release clock | None | Start | New models arrive on a timer and set your Edge |

## Starting balance numbers

These numbers are an untested first draft. Treat them as a starting point for the balance phase, not as final values.

| Item | Starting value |
| --- | --- |
| Base output per second | Cash 0.5 from day job, Followers 1, Know-how 0.2, Leads 0.1, build points 1 |
| Client work | Handles 0.2 Leads per second; each Lead burns 5 Credits and pays 8 Cash |
| Credits trickle | 1 per second on the free tier, growing 1.5x per subscription tier |
| Audience funnel | 1 Lead per second for every 2,000 Followers |
| Skill level effect | +12% output per level above 1 |
| XP needed for next level | 15 seconds of work, growing 1.25x per level |
| Starting stock | 20 Credits, 5 Know-how, 15 Cash |
| Agent seat costs (Cash) | 40, 400, 4,000, 40,000, 400,000 |
| Build points per venture | 60 for venture 1, growing 5x per venture |
| Build burn | 1 Credit and 0.2 Know-how per build point |
| Venture passive income | 0.5 Cash per second for venture 1, growing 3x per venture |
| Followers needed to launch | 5,000 for venture 6, growing 6x per venture |
| Prompt library effect and cost growth | +8% to +10% per level; cost grows 1.5x per level |
| Skill cost growth | 1.6x per level |
| Release clock | Second model generation at 150 seconds; each later one takes about 3x longer |
| Subscription upgrade cost (Cash) | 50 for tier 2, growing 6x per tier |
| Edge multiplier on Cash | 1.5x, 1.25x, 1.1x, 1x, 0.9x by generations behind |

### Lesson from the earlier prototype

A test bot played the earlier lab-themed prototype for 72 simulated hours and never finished the first milestone. It left nobody making one of the two resources that building burns, and progress stalled for good.

This redesign removes one cause, because Credits now arrive without a worker. Know-how can still run out while building, so the same stall is possible. The balance phase must test for it. Options:

- A small passive trickle of Know-how, as with Credits.
- A cheaper first and second agent seat, so three activities run within the first few minutes.
- A warning on screen the moment building is starved, naming the missing resource.

## Tech stack and repo structure

The stack is TypeScript, Vite, React and Vitest, deployed as a static site. Coding agents handle these tools well, and the result needs no server.

| Choice | Why |
| --- | --- |
| TypeScript | Type errors tell the agent what it broke before anything runs |
| Vite | Fast local preview and a one-command static build |
| React | Enough for a screen of cards, bars and buttons; no game engine needed |
| Vitest | The agent runs tests itself after every change |
| Browser local storage | Saves with no backend in version 1 |
| Static hosting | Any static host works; pick one in the final phase |

The repo is split so the game rules never import screen code:

```text
keep-up/
  CLAUDE.md              rules the agent reads at the start of every session
  docs/
    spec.md              the game design spec from this plan
    balance-log.md       each tuning change and the sim result that justified it
  src/
    engine/              pure game rules, no React, no browser APIs
      config.ts          every balance number lives here
      state.ts           the save-game shape and a fresh-game factory
      rates.ts           output per second for a worker and activity
      step.ts            advance the game by a number of seconds
      actions.ts         add agent, assign activity, buy prompt or skill,
                         record automation, upgrade subscription
      releases.ts        model release clock and the Edge multiplier
      save.ts            serialize, load, migrate between save versions
    ui/                  React components, read state and call actions only
    sim/
      bot.ts             a scripted player for headless playthroughs
      run.ts             prints the time each venture shipped
  tests/                 Vitest unit tests for the engine
```

## Agent setup

The agent starts every session with no memory, so the project's rules live in a `CLAUDE.md` file at the repo root. Create it in phase 0 with this content:

```markdown
# Keep Up

Browser idle game. Read docs/spec.md before changing game rules.

## Commands
- npm run dev      local preview
- npm test         run all unit tests
- npm run sim      headless playthrough, prints venture ship times
- npm run build    production build

## Rules
- src/engine must not import React, the DOM, or anything from src/ui.
- Every balance number lives in src/engine/config.ts. No magic numbers elsewhere.
- Engine functions take state and return or mutate state. No timers, no Date.now() inside the engine; time is passed in.
- Every engine change needs a unit test. Run npm test before saying a task is done.
- Never change the save shape without bumping the save version and adding a migration with a test.
- Do not add features that are not in the current phase. List ideas in docs/ideas.md instead.
- After a balance change, run npm run sim and record the result in docs/balance-log.md.
- Commit at the end of each phase with a message naming the phase.
```

Working rules for you as the operator:

- Start a fresh agent session for each phase. Long sessions drift and repeat mistakes.
- Ask the agent for a short plan before it writes code, and read the plan.
- Play the build yourself for five minutes at the end of every screen-facing phase. Tests cannot tell you whether it is fun.
- When something breaks, paste the exact error and ask for the cause before asking for a fix.

## Build phases

The build runs in ten phases, engine first and screen second, so the rules are tested before anything is drawn. Each phase is one agent session.

| Phase | Build | Done when |
| --- | --- | --- |
| 0. Scaffold | Vite, React, TypeScript and Vitest project; `CLAUDE.md`; `docs/spec.md`; empty engine and ui folders | `npm test`, `npm run dev` and `npm run build` all succeed |
| 1. Core engine | Config, state, resources, You plus agents, the starting activities (Day job tasks, Make content, Learn), the Credits trickle, skill XP and levels, `step(state, seconds)` | Tests show one worker on Make content for 60 seconds gains the expected Followers and levels |
| 2. Ventures | Build venture activity that burns Credits and Know-how, stall when starved, shipping, passive income, unlock flags | Tests cover full-speed building, starved building and shipping venture 1 |
| 3. Save and offline | Serialize, load, save version and migration, offline catch-up in chunks with a cap | A saved game reloads identically; 8 hours offline equals 8 hours of steps within 1% |
| 4. Playable screen | Resource bar, worker cards with activity buttons, venture progress card, add-agent flow, Do it yourself button, autosave | You can play from a fresh game to venture 2 in the browser on desktop and phone width |
| 5. Side hustle and upgrades | Find clients and Client work activities, prompt library, Skills, their tabs, team bonuses | Tests confirm Client work burns Leads and Credits and each upgrade changes the right rate |
| 6. Automations and audience | Record automation action, Followers-to-Leads trickle, Follower requirement on ventures 6 to 10 | Tests show an automation keeps producing after its worker changes activity; a venture cannot launch below its Follower count |
| 7. Release clock | Model releases over time, subscription tiers, Edge multiplier, release timeline display, news feed | Tests confirm Edge at each number of generations behind; an upgrade raises the Credits trickle |
| 8. Balance | Sim bot, pacing run, tune `config.ts` until targets in the next section are met | `npm run sim` hits every pacing target; changes logged in `balance-log.md` |
| 9. Polish and ship | Next-move hints, welcome-back summary, reset with confirmation, guide tab, deploy | A new player with no instructions ships venture 1; the public link works on a phone |

### Prompt template

Paste this at the start of each session, filling in the phase row from the table:

```text
We are building Keep Up. Read CLAUDE.md and docs/spec.md first.

This session is Phase <number and name> only.
Build: <the Build cell>
Done when: <the Done when cell>

Before writing code, give me a short plan: the files you will create or
change and the tests you will add. Wait for my go-ahead.

When finished, run npm test and npm run build, show me the results,
and list anything you were unsure about. Do not start the next phase.
```

### Reference prototype

A single-file draft of the earlier lab-themed version exists from the first session. Its formulas for output rates, burning resources while working, snapshots and a timed clock carry over under new names. Hand it to the agent in phase 1 as a reference for the rules, not as code to copy, because it mixes rules and screen code and its balance is broken.

## Testing and balance

Two kinds of checks protect the game: unit tests prove the rules are correct, and a simulation bot proves the pacing is playable. The agent runs both without a browser.

### Unit tests the engine must have

- Output per second for each activity, with and without a specialty.
- Skill XP carries over correctly when a level-up happens mid-step.
- Building at full speed, half-starved and fully starved.
- Client work stops when Leads or Credits run out.
- No resource ever goes below zero.
- A venture that needs Followers cannot launch below its count.
- The Edge multiplier is correct at zero to four generations behind.
- One 3,600-second step gives the same result as 3,600 one-second steps, within 1%.
- An old save version loads through its migration.

### Simulation bot

The bot plays by simple rules: add an agent when it can afford to, keep Know-how flowing before it builds, upgrade the subscription when a new model is out, buy the cheapest affordable upgrade, and record automations when unlocked. Run it for 30 simulated days and print when each venture shipped and the Edge at that moment.

The bot must cover every resource an activity burns before it starts that activity. The earlier prototype's bot did not, which is why it stalled.

### Pacing targets

These targets are proposals for a player who checks in a few times a day. Adjust them once real people play.

| Milestone | Target time from a fresh game |
| --- | --- |
| First agent added | Under 2 minutes |
| Venture 1 shipped | 3 to 5 minutes |
| Venture 2 shipped | 15 to 20 minutes |
| Venture 3 shipped | About 1 hour |
| Venture 5 shipped | End of day 1 |
| First Follower gate reached | Day 2 |
| Venture 10 shipped | 2 to 3 weeks |

A good run also has the player fall behind the latest model at least twice and catch up. If Edge is always at its maximum or always at its floor, change the release pace or upgrade costs in `config.ts`.

## After version 1 and open decisions

Nothing below is built until version 1 is live and people have played it. The first goal after launch is evidence: do players come back on day 2 and day 7?

### Options once it is live

| Option | What it adds | What it needs |
| --- | --- | --- |
| Web game portals | Reach and a share of ad revenue | Each portal's SDK and review; check their current terms |
| Android release | A Google Play listing | A wrapper around the web build and a developer account |
| Rewarded ads | Players watch an ad for a time skip | An ad network account and a portal or app that allows it |
| One-time supporter pack | Removes ads, adds cosmetics | A payment provider |
| Prestige layer | Restart with a permanent bonus, for long-term play | A new engine phase and a save migration |
| Cloud saves | Play across devices | Accounts and a backend |

### Decisions for you

- [ ] Keep the working name Keep Up, or pick another before any public link exists.
- [ ] Keep the AI labs and their model names fictional. Recommended, since real company names invite trademark complaints.
- [ ] Decide whether quitting the day job becomes a late-game choice with its own trade-off.
- [ ] Choose the art direction: text and bars only, or commissioned or generated icons.
- [ ] Choose a static host for the public link.
- [ ] Decide whether the 8-hour offline cap stays or becomes an upgrade path only.

### Risks

- **Balance takes longer than code.** Expect the balance phase to need several sessions. The sim bot exists to make each attempt take minutes.
- **Scope creep.** IdleOn has dozens of systems built over years. Version 1 has six. New ideas go in `docs/ideas.md`.
- **Broken saves.** A save-format change without a migration wipes players' progress. The rule in `CLAUDE.md` guards against it.
- **Browser-only saves.** Clearing site data erases progress. Tell players plainly on the guide tab.
