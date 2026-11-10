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
