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

These numbers are an untested first draft. Treat them as a starting point for
the balance phase, not as final values. They live in `src/engine/config.ts`.

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

Only implemented activities appear. The provisional look is text and bars only;
the final art direction remains an operator decision.

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

Ventures 6 to 10 require Followers to launch: 5,000 at venture 6, growing 6x per
venture. Building, burn and shipping wait until the count is met.
