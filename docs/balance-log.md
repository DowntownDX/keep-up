# Balance log

One entry per tuning change: what changed, the sim result that justified it, and
the date.

The bot is idle play, decisions every five seconds. Times are from a fresh game.

## 2026-11-10 — Phase 8 baseline (Phase 7 numbers)

Result: first agent 0:30, venture 1 1:25, venture 2 4:40, venture 3 17:35,
venture 5 3:16, first gate never, venture 10 not reached in 30 days, Edge at
1.5 for 100% of the run.

Read: the early game was far too fast, the late game was unreachable, and the
subscription was always affordable, so Edge never mattered.

## 2026-11-10 — Round 1: build cost, Know-how burn and content rate

Changed: build points 180 x 3.5 per venture (was 60 x 5); Know-how burn 0.05
per point (was 0.2); Make content 0.1 per second (was 1); follower gates 30,000
x 3 (was 5,000 x 6); subscription 25 Cash x 10 per tier (was 50 x 6).

Result: venture 1 2:40, venture 2 9:55, venture 3 26:25, venture 5 2:47,
venture 10 11d 09:49, first gate never. Edge had two values.

Read: venture 10 fell into range, but the first hour was still too fast and the
early seats arrived too soon.

## 2026-11-10 — Round 2: early point curve, seats and subscription table

Changed: build points to 260, 1,000, 4,300, 14,190, 46,830, 154,540, 510,000,
1,683,000, 5,555,000, 18,330,000; seat costs to 40, 800, 12,000, 120,000,
1,200,000; subscription costs to 25, 500, 15,000, 300,000, 6M, 60M, 300M, 1B,
3B; follower gate 120,000 x 2.

Result: venture 1 4:00, venture 2 14:20, venture 3 38:00, venture 5 3:52,
venture 10 16d 07:10; first gate 6:46; three Edge values and two episodes.

Read: venture 1 and venture 10 passed; venture 2/3 needed a few more minutes
and the gate opened far too early.

## 2026-11-10 — Round 3: venture 3 points and a heavier first gate

Changed: venture 3 build points 4,300 to 4,700; follower gate 120,000 to
1,000,000 x 2.

Result (two-day run): venture 1 4:00, venture 2 15:20, venture 3 50:45,
venture 5 6:14, first gate 23:01, venture 6 1d 07:29; three Edge values.

Read: everything passed except the first gate, which missed the day-2 window
by one hour.

## 2026-11-10 — Round 4: final gate value

Changed: follower gate 1,000,000 to 1,150,000.

Result: first agent 0:30, venture 1 4:00, venture 2 15:20, venture 3 50:45,
venture 5 6:14, first gate 1d 01:15, venture 10 18d 03:14; four fall-behind
episodes, three Edge values, final Edge 1.5, 34% of the run at maximum Edge,
no negative resources. All pacing and arms-race checks pass.

Read: the bot now meets every target; no further tuning this round.
