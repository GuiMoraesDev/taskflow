---
name: plan-start
description: Scaffold the plan docs - SCOPE.md, TASKS.md, QUESTIONS.md and PROGRESS.md - for a new piece of work before any code is touched. Scope, one task per commit, each task carrying a category and the model that must take it, and every open question carrying a recommendation. Use when starting a feature, refactor or bug batch, or when the user says "plan this", "start a project", or names a project folder that does not exist yet.
---

# plan-start

No code is touched until these four files exist.

## 1. Read the config

`.claude/workflow.json` gives `projectsDir` and the tier-to-model mapping. If it is missing, run `init-workflow` first - do not guess a mapping, it is the repo owner's call.

Target: `<projectsDir>/<project-name>/` holding `SCOPE.md`, `TASKS.md`, `QUESTIONS.md` and `PROGRESS.md`. Kebab-case the project name from the user's words. If the folder already exists, read it and continue that plan instead of overwriting it.

Four files, one job each:

| File           | Owns                                                                  |
| -------------- | --------------------------------------------------------------------- |
| `SCOPE.md`     | what may change, what may not, the constraints, what "done" means    |
| `TASKS.md`     | the detail of each task - files, approach, verification              |
| `QUESTIONS.md` | every open decision, its options, its consequences, a recommendation |
| `PROGRESS.md`  | the ledger - tasks and questions interleaved in order, plus the log  |

## 2. Understand before planning

Read the code the work touches. A plan written from the request alone produces tasks that turn out wrong on contact.

For anything spanning more than two files, delegate the survey to the `plan-architect` agent and write the plan from what it reports. Spawn it with `model` set to `models.deep` from the config - the agent's own frontmatter is only the fallback when no config exists.

If the repo keeps a glossary - `.claude/workflow.json` `decisions.glossary` names it - read it and use its terms throughout the plan. A plan that renames the domain forces every reader to translate. Where the work contradicts an existing decision record, say so before planning around it.

## 3. Harvest what is already decided

Before writing a single question, collect the decisions that have **already been made** - in this conversation, in a design session that preceded it, in an existing decision record. Each becomes an answered entry in `QUESTIONS.md` with its provenance, not an open question.

Never ask what the owner has already told you. A plan that reopens a settled decision spends their patience and teaches them that answering early is wasted effort.

## 4. Write SCOPE.md

Copy `templates/SCOPE.md`.

**Scope is the part that earns its keep.** Name the areas the plan may change, and the tempting ones it may not. State the escape hatch explicitly: if a task turns out to require an out-of-scope change, stop and raise it rather than widening the plan.

## 5. Write TASKS.md

Copy `templates/TASKS.md`.

**One task is one commit.** If a task cannot be described as a single commit message, it is two tasks. Each declares:

| Field        | Rule                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category     | 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation (produces a finding, not a commit)                                                                                     |
| Model        | The tier - 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human-only - written with the model `workflow.json` maps it to, so the row tells the runner what to switch to |
| Files        | The real paths. A task with no file list is not planned yet                                                                                                               |
| Blocked by   | The question IDs that must be answered first, or `—`                                                                                                                      |
| Verification | For 🔴, name the test to add and the behaviour it must fail against. For 🟡, name any test that has to move                                                               |

Order tasks so each leaves the tree green. A task whose only justification is "we will need it later" is not a task.

**Cut vertically.** A task carries one behaviour through every layer it touches, so finishing it makes something observably true. "Add the column" passes the gates and gives a reviewer nothing to check - it is a layer, not a task. Ask what is true after the commit that was not true before it.

**Wide mechanical changes are the exception.** When one change breaks call sites across the codebase at once, no vertical slice stays green, so sequence it as expand, migrate, contract - the template carries the shape. Forcing a rename into vertical slices produces tasks that cannot satisfy their own verification.

## 6. Write QUESTIONS.md

Copy `templates/QUESTIONS.md`. Number the questions **in the order the tasks need them**, not in the order they occurred to you.

**Only decisions belong here.** If the repository can answer it - the code, the config, the history, the CI workflow - go and read it. An unanswered question halts its task, so every question that the repo could have settled costs the owner a round trip and buys nothing. Put to them the preferences, priorities and trade-offs, and nothing else.

**Every question carries a recommendation.** No exceptions. A question handed to the owner without a recommendation is unfinished work - you read the code, they did not.

Then mark each one. The mark sets how hard the question is pressed - every question blocks its task either way.

- **🟦 routine** - a preference, a name, a default. Cheap to reverse. Put to the owner in a line.
- **⚠️ critical** - hard, expensive to reverse, narrowly specific to this business, high priority, **or carrying any security consequence**. These get a `Consequence:` line per option and a `Consequence of getting this wrong:` line for the question, written in the terms an incident report would use.

Mark ⚠️ whenever the answer changes who can read or write data, crosses a trust boundary, or touches authorization - an unchecked object reference (IDOR), a permission default, a token lifetime, a field added to a public response, a rate limit, anything logged. When in doubt between the two marks, it is ⚠️. The cost of over-marking is a consequence spelled out that did not need to be; the cost of under-marking is an owner waving through a vulnerability because nobody told them it was one.

## 7. Write PROGRESS.md

Copy `templates/PROGRESS.md`. One ledger in execution order, with **each question sitting directly above the task it blocks**, owned 🙋 by the repo owner.

The asking rules are the point of the ordering:

- **Ask late.** A question is put to the owner when the run reaches the task below it. Do not open the plan by asking all of them.
- **Accept early.** If the owner answers one before it is asked, record it in `QUESTIONS.md` and flip the row immediately. Never re-ask what has been answered.
- **Unanswered at its task: stop.** The task does not start, whatever the mark. A recommendation lets the owner answer in one word; it is not permission to proceed without them.
- **Unsure either way** - the answer was ambiguous, or it opened something the plan did not consider - the row stays 🚧 and progress stops. Do not resolve an owner's half-answer by inference.

The mark decides how the question is put, not whether it blocks. 🟦 goes over in a line; ⚠️ leads with the consequence. Both stop the task until answered.

A blocked task holds itself, not the run. Every ⬜ task whose blockers are settled is on the **frontier** and may be taken; the ledger's order says which is preferred.

## 8. Hand back

Report the task list as a table with categories and models, name the frontier - every task that could start now - and the model the first one needs, then stop. Do not start it in the same turn.

Say how many questions are open and how many are ⚠️, but **do not ask them yet** - name the task each is attached to instead. If the owner volunteers answers now, take them and record them with their provenance.
