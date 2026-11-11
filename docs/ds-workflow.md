# DS workflow

A small operating system for DS-F sessions. It uses the `ds-*` skills to cover
the places a fast model usually fails: planning, verification, review, context
drift, repeated fixes, generic UI and verbose prose.

The honest limit: the skills close process gaps, not capability gaps. They make
the work more reliable and auditable. Fresh-context review and real checks are
the equalizers.

## 1. Default spine

Every session:

1. `ds-mode` is on. Restate the goal in one line; read the files you will touch
   and their callers; make the smallest diff.
2. Read the project contract first: `AGENTS.md` or `CLAUDE.md`, `docs/spec.md`,
   `docs/decisions.md`, the current `PLAN.md`, `git status`.
3. Classify the task: Quick, Standard or Deep.
4. Write state down. Memory is the weak part; files are the reliable part.
5. Before saying done, show the command and the result.

## 2. Three task modes

### Quick — one file, fewer than three steps

- One-line plan.
- Edit.
- `ds-verify-loop`.
- Report with evidence.

No plan ceremony. No jury.

### Standard — a feature or multi-file change

- `ds-plan-loop`: numbered steps, each with a check; one fresh-context critique;
  revise.
- Execute one step at a time.
- `ds-verify-loop` after every step.
- `ds-review-loop` on the final diff.
- `ds-pr` or `ds-ready` if it ships.

### Deep — new subsystem, risky change, UI or research

- `ds-sharpen` if the goal is vague.
- `ds-blueprint` for types and module shape.
- `ds-plan-loop`.
- `ds-tdd` where a cheap test exists.
- `ds-blast-radius` for risky changes.
- `ds-design` or `ds-design-audit` for UI.
- `ds-jury` or `ds-swarm` only when independent opinions or wide coverage pay
  for themselves.

## 3. Routing table

| Trigger | Skill | Artifact or check |
| --- | --- | --- |
| Any coding session | `ds-mode` | One-line goal, smallest diff |
| Vague or high stakes | `ds-sharpen`, then `ds-plan-loop` | Sharpened brief, plan |
| More than a few files or steps | `ds-plan-loop` | `PLAN.md` with checks |
| New module or API shape | `ds-blueprint` | Types, signatures, module layout |
| Bug with a cheap test | `ds-tdd` | Failing test first, then fix |
| Any code change | `ds-verify-loop` | Real command output |
| Same failure twice | `ds-unstick` | Named assumption, new approach |
| Nontrivial diff | `ds-review-loop` | Fresh-context findings |
| Risky change | `ds-blast-radius` | What else could break, proven |
| Several model opinions | `ds-jury` | Independent reviews |
| Wide research or audit | `ds-swarm` | Parallel findings, one report |
| New UI | `ds-design` | A visual direction |
| Generic-looking UI | `ds-design-audit` | Scored review plus fixes |
| Docs, prose, copy | `ds-unslop` | Plain, specific language |
| Long run | `ds-ledger` | Decision and state log |
| Context past about half | `ds-context-reset` | `PROGRESS.md`, fresh session |
| Returning after time away | `ds-catchup` | Short catch-up and open decisions |
| Repeated agent mistake | `ds-lessons` | Structure that prevents it |
| Opening a PR | `ds-pr` | PR description |
| Ready, stop before merge | `ds-ready` | Mergeable branch |
| Someone else's branch | `ds-adopt` | Finished original goal |
| Stale PR | `ds-revive` | Rebase, rework or close decision |
| Understanding code | `ds-explain` | Plain-language explanation |
| Unsure which skill | `ds-help` | One recommendation |

Recommend one skill. Name a second only when the task clearly has two phases.

## 4. Gates

### Gate 0 — baseline

- Task restated.
- Repo state known.
- Existing tests or checks run, or the skip is stated.

### Gate 1 — plan

- Numbered steps, each with a command or observation that proves it.
- One fresh-context critique: what is missing, what is unverified, what is
  simpler?
- Plan revised before code.

### Gate 2 — execution

- One step per diff.
- Real check after each.
- Evidence recorded in the plan.
- Two failures trigger `ds-unstick`, not a third variation.

### Gate 3 — review

- Nontrivial diff gets `ds-review-loop`.
- Risky diff gets `ds-blast-radius`.
- UI gets `ds-design-audit`.
- Prose gets `ds-unslop`.

### Gate 4 — report

- Goal, files, commands and results, blockers.
- Claims labelled measured, inferred or guessed.
- Skipped checks stated plainly.

### Gate 5 — ship

- `ds-pr` or `ds-ready`.
- No merge unless explicitly asked.

## 5. Adversarial pair

For planning, verifying, designing or reviewing, a single pass is often too
kind to itself. Use two fresh DS-F subagents:

- **Proposer** produces the plan, design, verification approach or review
  summary. It states assumptions and checks. It does not edit.
- **Adversary** attacks the proposal: missing steps, unchecked assumptions,
  simpler paths, false confidence, tests that would not catch the bug. It may
  run independent checks. It does not edit.
- **Lead** reconciles the two, records the decision, and is the only writer.

This is not a debate for its own sake. The output is a revised plan or review
with the disagreement resolved.

## 6. Swarm rule

Before building, ask: **can the work be split into independent slices?**

- **No:** one writer, sequential.
- **Yes:** launch a sibling swarm, one worker per slice. Each worker owns a
  separate path or module, runs its own checks, and reports back. The lead
  merges and runs the integration check.
- **Maximum layer 1.** Subagents may not spawn their own subagents. The lead
  orchestrates one layer only.

Swarm only when the slices are genuinely independent. A swarm over shared files
creates merge conflicts and duplicated work.

## 7. Artifacts

- `PLAN.md` — numbered steps, checks, evidence.
- `PROGRESS.md` or `docs/ledger.md` — decisions, state, next step.
- Tests and command output — the proof.
- `notes/<task>-review.md` — review findings.
- `TRIAL_LOG.md` — for workflow experiments, one row per task.

## 8. Context and continuity

- Bulk reading, wide searches and research go to subagents; ask for a short
  conclusion with paths.
- At about half context, write `PROGRESS.md` and move to a fresh session.
- On return, `ds-catchup` reads the log and lists open decisions.
- Do not reread a file just edited. Do not repeat a search already run.

## 9. Metrics

Track what the workflow is supposed to improve:

- First-pass verify rate.
- Rework count per task.
- Review findings per diff.
- Plan steps missed or added mid-flight.
- Context resets per phase.
- Time from “done” claim to green check.

Feed repeated misses into `ds-lessons`.

## 10. What not to do

- Do not load all 27 skills. Use one or two by trigger.
- Do not self-review a nontrivial diff and call it reviewed.
- Do not spawn a swarm for a task with shared files.
- Do not treat a skill invocation as evidence. The command output is evidence.
- Do not continue after two failures of the same idea.
- Do not let a subagent spawn another subagent.
- Do not claim a check ran when it did not.

## 11. Encoding

- Global DS-F agent: preload `ds-mode` and the four hard gates.
- Project: `AGENTS.md` carries the enforceable rules; this document carries the
  full reference.
- Trial project: `C:\DEV\swarm\ds-f-optimization-trial` adds the adversarial
  pair, the parallelization check and the max-layer-1 swarm rule.
