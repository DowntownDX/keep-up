# Keep Up — Game Design Spec

You are a regular person using AI to get ahead. You hold a day job, run a side
hustle and grow a social media presence, all at the same time. In the
background, AI labs release stronger models on a clock, and you have to keep up.

The structure borrows from IdleOn: you and your AI agents each work one activity
at a time, there are always more activities than workers, and what one worker
makes strengthens the others.

Version 1 is single-player, runs entirely in the browser, and saves locally. No
accounts, no server, no payments, no ads.

## Resources

| Resource | Comes from | Used for |
| --- | --- | --- |
| Cash | Day job tasks, Client work, shipped ventures | Agent seats, subscription upgrades, prompt library |
| Followers | Make content | Never spent. They bring in Leads over time and gate the launch of ventures 6 to 10 |
| Leads | Find clients, plus a trickle from Followers | Client work |
| Know-how | Learn | Skills, building ventures |
| Credits | Your AI subscription, a steady trickle that needs no worker | Client work, building ventures |

## Activities

| Activity | Track | Makes | Burns | Opens |
| --- | --- | --- | --- | --- |
| Day job tasks | Day job | Cash, steady | Nothing | Start |
| Make content | Content | Followers | Nothing | Start |
| Learn | All three | Know-how | Nothing | Start |
| Build venture | Side hustle | Venture progress | Credits and Know-how | Start |
| Find clients | Side hustle | Leads | Nothing | Venture 1 |
| Client work | Side hustle | Cash, high | Leads and Credits | Venture 1 |

## Workers

- The player starts alone and can add up to five AI agents with Cash.
- Each worker does exactly one activity. Each activity has its own skill level
  per worker, which rises only while they do it.
- Levels are kept when a worker switches activities.

| Worker | Bonus |
| --- | --- |
| You | 1.2x at every activity |
| Assistant agent | 1.6x at Day job tasks and Client work |
| Creator agent | 1.6x at Make content |
| Scout agent | 1.6x at Find clients |
| Tutor agent | 1.6x at Learn |
| Builder agent | 1.6x at Build venture |

## Ventures

Ventures are the game's bosses. Building one burns Credits and Know-how for
every build point. Shipping one pays passive Cash forever and unlocks the next
system. The ten ventures in order: Prompt pack, Newsletter, Template shop,
Faceless video channel, Online course, Browser extension, Mobile app, Micro SaaS,
Automation agency, Product portfolio. Shipping the tenth wins the game: your
income no longer depends on the day job.

## The arms race in the background

AI labs release a new model generation on a clock, ten in total. A release does
nothing for you until you pay Cash to upgrade your subscription to it. Each
upgrade raises your Credits trickle.

Your Edge is how close your tools are to the latest release, and it multiplies
all Cash you earn: 1.5x on the latest model, 1.25x one behind, 1.1x two behind,
1x three behind, 0.9x four or more behind. Everyone else gets the new models
too, so standing still means falling behind.

## Systems and when they unlock

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

These numbers are the Phase 8 tuned values. They live in
`src/engine/config.ts`; the rounds that produced them are in
`docs/balance-log.md`.

| Item | Starting value |
| --- | --- |
| Base output per second | Cash 0.5 from day job, Followers 0.1, Know-how 0.2, Leads 0.1, build points 1 |
| Client work | Handles 0.2 Leads per second; each Lead burns 5 Credits and pays 8 Cash |
| Credits trickle | 1 per second on the free tier, growing 1.5x per subscription tier |
| Audience funnel | 1 Lead per second for every 2,000 Followers |
| Skill level effect | +12% output per level above 1 |
| XP needed for next level | 15 seconds of work, growing 1.25x per level |
| Starting stock | 20 Credits, 5 Know-how, 15 Cash |
| Agent seat costs (Cash) | 40, 800, 12,000, 120,000, 1,200,000 |
| Build points per venture | 260 for venture 1, then the tuned curve in `config.ts` |
| Build burn | 1 Credit and 0.05 Know-how per build point |
| Venture passive income | 0.5 Cash per second for venture 1, growing 3x per venture |
| Followers needed to launch | 1,150,000 for venture 6, growing 1.8x per venture |
| Prompt library effect and cost growth | +8% to +10% per level; cost grows 1.5x per level |
| Skill cost growth | 1.6x per level |
| Release clock | Second model generation at 150 seconds; each later one takes about 3x longer |
| Subscription upgrade cost (Cash) | 25 for tier 2, then the tuned table in `config.ts` up to 3B |
| Edge multiplier on Cash | 1.5x, 1.25x, 1.1x, 1x, 0.9x by generations behind |

## Lesson from the earlier prototype

A test bot played the earlier lab-themed prototype for 72 simulated hours and
never finished the first milestone. It left nobody making one of the two
resources that building burns, and progress stalled for good.

Credits now arrive without a worker, which removes one cause. Know-how can still
run out while building, so the same stall is possible. The balance phase must
test for it. Options:

- A small passive trickle of Know-how, as with Credits.
- A cheaper first and second agent seat, so three activities run within the
  first few minutes.
- A warning on screen the moment building is starved, naming the missing
  resource.

## Pacing targets

For a player who checks in a few times a day.

| Milestone | Target time from a fresh game |
| --- | --- |
| First agent added | Under 2 minutes |
| Venture 1 shipped | 3 to 5 minutes |
| Venture 2 shipped | 15 to 20 minutes |
| Venture 3 shipped | About 1 hour |
| Venture 5 shipped | End of day 1 |
| First Follower gate reached | Day 2 |
| Venture 10 shipped | 2 to 3 weeks |

A good run also has the player fall behind the latest model at least twice and
catch up. If Edge is always at its maximum or always at its floor, change the
release pace or upgrade costs in `config.ts`.

## Implementation decisions

Rules the design leaves open are recorded in
[docs/decisions.md](decisions.md): starting state, tick model, venture shipping,
save policy and offline behaviour. Read it before changing engine behaviour.

## Playable screen (Phase 4)

The version 1 screen is a ledger-style control board: a resource strip, one card
per worker with activity buttons and Do it yourself, the current venture with
its build bar and passive income, and a hire panel. It autosaves to localStorage
every five seconds and on page hide, and applies up to eight hours of offline
work on load.

Only implemented activities appear. Phase 4 shipped text and bars only; the
Phase 10 feel pass adds the paper sheet, the live worker feedback, the ledger
and the stamp book. A full art pass remains an operator decision.

## Side hustle and upgrades (Phase 5)

Find clients and Client work open after venture 1 ships. Find clients makes
Leads. Client work handles 0.2 Leads per second, paying 8 Cash and burning 5
Credits per Lead, capped by both stocks.

The Prompt library costs Cash and adds 8% per level to non-Cash output. Skills
cost Know-how and add 10% per level to non-Know-how output. Specialist levels
above 1 also add 0.5% to their activity for every worker.

## Automations, audience and gates (Phase 6)

Automations unlock after venture 2. Each agent can hold one frozen snapshot at
50% of its output when recorded. It runs without the worker and earns no XP;
build and Client work snapshots still burn their stock. The audience funnel
unlocks after venture 3 and makes 1 Lead per second per 2,000 Followers.

Ventures 6 to 10 require Followers to launch: 1,150,000 at venture 6, growing
1.8x per venture. Building, burn and shipping wait until the count is met.

## Release clock, subscriptions and Edge (Phase 7)

The labs release ten model generations on game time. Generation 1 is current at
the start, generation 2 arrives after 150 seconds, and each later one takes
three times as long as the interval before it. A release does nothing for you
until you pay Cash to upgrade: tier 2 costs 25 Cash, then the tuned table in
`config.ts` up to 3B, and tier 10 is the cap.

Edge is how close your subscription is to the latest release. It multiplies all
Cash you earn: 1.5x on the latest generation, 1.25x one behind, 1.1x two behind,
1x three behind and 0.9x four or more behind. It never changes what you spend
or the other resources. The screen shows the generation timeline, the next
release countdown, the current Edge and a release news feed.

## Balance pass (Phase 8)

A headless bot plays a fresh game for thirty simulated days with simple rules:
hire in order, keep Learn ahead of build burn, staff Cash, Followers and Leads,
upgrade the subscription when a release is out and Cash allows, and record
automations. `npm run sim` prints every venture ship time, the Edge at each
ship and PASS/FAIL per pacing target; it exits nonzero when a target is missed.

The first-draft numbers above were replaced by the tuned values in the table
and in `config.ts`: a steeper early build curve with a flatter tail, 0.05
Know-how per build point, 0.1 Followers per second, seats up to 1.2M Cash, a
1.15M first Follower gate growing 1.8x, and a subscription cost table ending at
3B Cash. The tuning rounds are recorded in `docs/balance-log.md`.

## Polish and ship (Phase 9)

A next-move card names one useful action at a time: put someone to work, hire,
grow Followers for a gate, build, upgrade the subscription, record an
automation or buy an upgrade. It never changes the game by itself.

When the game loads after time away, a dismissible welcome-back panel reports
the hours credited (up to eight), the resources the team made and any ventures
that shipped. The Guide card has a How to play tab and a Your data tab; the data
tab states that progress lives in this browser only and that clearing site data
erases it. Reset asks for confirmation twice and then starts a fresh game.

The production build is a static site: `npm run build` writes `dist/`, and
`npm run verify:preview` runs the whole browser check against that built bundle
at desktop and phone width. The host and public URL remain the operator's
choice and are not part of this repository; `docs/deploy.md` lists the steps.

## The feel pass (Phase 10)

The venture is the focal object: a focus row pairs the venture sheet with the
next move, the crew follows below, and the release, upgrade and hire rail runs
down the side. The venture reads as a sheet of paper: ruled lines, a margin
rule, a hard offset shadow, and a masthead smaller than the venture title.

Every action answers: buttons press in, the resource strip flashes, and Do it
yourself stamps WORKED on the worker card. Motion is short and respects
`prefers-reduced-motion`; the colour flash remains as non-motion feedback.

Each worker card carries a one-letter monogram, a live dot and the current
output rate. Idle workers say "Waiting for a task"; a gated, stalled or
finished worker says why. A Ledger card records ships, level-ups, hires,
upgrades, subscription tiers, automations and releases from state diffs. It
keeps the six newest lines, is not persisted and clears on reset. A Stamps card
derives eight milestones from the current state and shows earned and locked
stamps.

The venture card shows an "About ..." ETA from the slowest of build output,
Credits per point and Know-how per point, including stock buffers. It shows no
ETA when the venture is gated, won, unstaffed or cannot finish. The upgrade
tabs show the current and next bonus and the time to afford. A ship briefly
stamps SHIPPED.

Phase 10 changes presentation and UI state only; the engine, balance and save
shape are unchanged.
