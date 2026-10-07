---
name: plan-start
description: Scaffold the plan docs - SCOPE.md, TASKS.md, QUESTIONS.md and PROGRESS.md - for a new piece of work before any code is touched. Scope, the work split into pull requests of one topic and under 400 lines each, acceptance criteria agreed with the owner per pull request, one task per commit carrying a category and the model that must take it, the tests each task proves red first, and every open question carrying a recommendation. Use when starting a feature, refactor or bug batch, or when the user says "plan this", "start a project", or names a project folder that does not exist yet.
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
| `TASKS.md`     | the pull requests, their acceptance criteria, and each task's detail |
| `QUESTIONS.md` | every open decision, its options, its consequences, a recommendation |
| `PROGRESS.md`  | the ledger - tasks and questions interleaved in order, plus the log  |

## 2. Understand before planning

Read the code the work touches. A plan written from the request alone produces tasks that turn out wrong on contact.

For anything spanning more than two files, delegate the survey to the `plan-architect` agent and write the plan from what it reports. Spawn it with `model` set to `models.deep` from the config - the agent's own frontmatter is only the fallback when no config exists.

If the repo keeps a glossary - `.claude/workflow.json` `decisions.glossary` names it - read it and use its terms throughout the plan. A plan that renames the domain forces every reader to translate. Where the work contradicts an existing decision record, say so before planning around it.

## 3. Grill the plan

Before anything is written, follow `grilling.md` in this skill's folder: interview
the owner in rounds over the design tree of the work, each question carrying your
recommended answer, until the frontier is empty and the owner confirms you share
an understanding. The survey from step 2 is what lets you look facts up instead
of asking them.

Its frontier is a frontier of **decisions**, not of tasks. Everything the
grilling settles is harvested in the next step; anything the owner chooses to
leave open becomes a question in `QUESTIONS.md`, asked at its task.

## 4. Harvest what is already decided

Before writing a single question, collect the decisions that have **already been made** - in the grilling, in this conversation, in a design session that preceded it, in an existing decision record. Each becomes an answered entry in `QUESTIONS.md` with its provenance, not an open question.

Never ask what the owner has already told you. A plan that reopens a settled decision spends their patience and teaches them that answering early is wasted effort.

## 5. Write SCOPE.md

Copy `templates/SCOPE.md`.

**Scope is the part that earns its keep.** Name the areas the plan may change, and the tempting ones it may not. State the escape hatch explicitly: if a task turns out to require an out-of-scope change, stop and raise it rather than widening the plan.

## 6. Split the work into pull requests

Copy `templates/TASKS.md`. The owner reviews the work on GitHub, so the plan is
written in the units they will see there: **pull requests**, each holding the
tasks that land on its branch.

A pull request is one **topic** - a feature, a fix, a refactor of one area, a
set of files that belong together. Two topics are two pull requests, however
small. Each stays under `pullRequests.maxLines` from the config (400 when unset),
counting additions plus deletions and excluding the paths in
`pullRequests.excludeFromCount` - tests, lockfiles, snapshots, generated files.
Estimate from the files the survey named; when an estimate is over, split by
topic or by file group, never by cutting a behaviour in half.

Each pull request section says what the owner will see on GitHub, before any of
it exists:

| Field                         | Rule                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Title                         | The conventional-commit title the pull request will carry, `<type>: <description>`         |
| Branch                        | `<type>/<slug>` and its base - the default branch, or the branch of the pull request it depends on |
| Size                          | The estimate against the budget, `~310 / 400`                                              |
| Tasks                         | The task IDs that land on it, in order. Each is one commit                                 |
| What you will see on GitHub   | The commits in order, the files, and what the reviewer checks                              |
| Acceptance criteria           | Step 7                                                                                     |

The concept of a task does not change: one task is one commit, applied and
reviewed on its own, on the model it declares. A pull request only groups them.

## 7. Agree the acceptance criteria

Every pull request that changes behaviour carries acceptance criteria, numbered
`AC-1`, `AC-2` across the whole plan. Each is one observable outcome in
given/when/then form, specific enough that a test can fail against it - "Given
five failed logins in a minute, when a sixth arrives, it is refused with 429",
not "login is rate-limited".

Write the pull request sections into `TASKS.md` with their criteria marked
`📋 in discussion` before cutting tasks, so the discussion survives a lost
session. Then put them to the owner, one pull request at a time, and **discuss
until they agree**: take their edits, propose what they missed - the error
paths, the boundaries, the existing behaviour that must not move - and say what
each criterion costs when it widens the work.

When the owner agrees, mark the pull request's criteria `✅ agreed <date>` and
log it. Do not infer agreement from silence or from a reply about something
else. Criteria are the one thing agreed up front rather than at the task:
every task's tests are derived from them, so a criterion that changes later
changes tests already written.

A pull request that changes no behaviour - a pure refactor, a chore - says so in
place of the criteria, and the owner agrees to that too.

## 8. Cut the tasks

**One task is one commit.** If a task cannot be described as a single commit message, it is two tasks. Each declares:

| Field        | Rule                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category     | 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation (produces a finding, not a commit)                                                                                     |
| Model        | The tier - 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human-only - written with the model `workflow.json` maps it to, so the row tells the runner what to switch to |
| Files        | The real paths, tests included. A task with no file list is not planned yet                                                                                              |
| Blocked by   | The question IDs that must be answered first, or `—`                                                                                                                      |
| Covers       | The acceptance criteria this task proves, or `—`                                                                                                                          |
| Tests        | The tests it adds or changes, red first - each with the criterion it covers and why it matters. Or **No new test** and the reason                                        |

Every agreed criterion is covered by at least one task, and every behaviour test
names the criterion it covers. A test that covers no criterion is either missing
a criterion - raise it with the owner - or not worth writing.

**No new test** is legitimate only when the task changes no behaviour: a refactor
proven by the existing suite staying green before and after, a version bump, a
docs edit, a 🙋 step. Say which, in the task.

Order tasks so each leaves the tree green. A task whose only justification is "we will need it later" is not a task.

**Cut vertically.** A task carries one behaviour through every layer it touches, so finishing it makes something observably true. "Add the column" passes the gates and gives a reviewer nothing to check - it is a layer, not a task. Ask what is true after the commit that was not true before it.

**Wide mechanical changes are the exception.** When one change breaks call sites across the codebase at once, no vertical slice stays green, so sequence it as expand, migrate, contract - the template carries the shape. Forcing a rename into vertical slices produces tasks that cannot satisfy their own verification.

## 9. Write QUESTIONS.md

Copy `templates/QUESTIONS.md`. Number the questions **in the order the tasks need them**, not in the order they occurred to you.

**Only decisions belong here.** If the repository can answer it - the code, the config, the history, the CI workflow - go and read it. An unanswered question halts its task, so every question that the repo could have settled costs the owner a round trip and buys nothing. Put to them the preferences, priorities and trade-offs, and nothing else.

**Every question carries a recommendation.** No exceptions. A question handed to the owner without a recommendation is unfinished work - you read the code, they did not.

**The recommendation explains itself.** "A, because it is simpler" is not enough. Give the template's four lines:
- **Why** - tied to something checkable, and why the other options lose.
- **What it looks like** - a concrete example, one per option for any copy or UX choice.
- **What it costs.**
- **Reversible by.**

An owner who can see the outcomes can answer in one word. An owner who can only see labels has to ask you what they mean, and that round trip is exactly what the recommendation exists to save.

**Give every question a status marker** - ⬜ unanswered, 🚧 partly answered, ✅ answered. It goes in its heading (`### ⬜ Q1 · 🟦 …`) and in the status table at the top of the file. A question harvested as already decided starts at ✅.

Then mark each one. The mark sets how hard the question is pressed - every question blocks its task either way.

- **🟦 routine** - a preference, a name, a default. Cheap to reverse. Put to the owner in a line.
- **⚠️ critical** - hard, expensive to reverse, narrowly specific to this business, high priority, **or carrying any security consequence**. These get a `Consequence:` line per option and a `Consequence of getting this wrong:` line for the question, written in the terms an incident report would use.

Mark ⚠️ whenever the answer changes who can read or write data, crosses a trust boundary, or touches authorization - an unchecked object reference (IDOR), a permission default, a token lifetime, a field added to a public response, a rate limit, anything logged. When in doubt between the two marks, it is ⚠️. The cost of over-marking is a consequence spelled out that did not need to be; the cost of under-marking is an owner waving through a vulnerability because nobody told them it was one.

## 10. Write PROGRESS.md

Copy `templates/PROGRESS.md`. One ledger in execution order: each pull request row heads its tasks, and **each question sits directly above the task it blocks**, owned 🙋 by the repo owner.

The asking rules are the point of the ordering:

- **Ask late.** A question is put to the owner when the run reaches the task below it. Do not open the plan by asking all of them.
- **Accept early.** If the owner answers one before it is asked, record it in `QUESTIONS.md` and flip it to ✅ immediately - its heading, the status table and its `PROGRESS.md` row, all in the same turn. Never re-ask what has been answered.
- **Unanswered at its task: stop.** The task does not start, whatever the mark. A recommendation lets the owner answer in one word; it is not permission to proceed without them.
- **Unsure either way** - the answer was ambiguous, or it opened something the plan did not consider - the row stays 🚧 and progress stops. Do not resolve an owner's half-answer by inference.

The mark decides how the question is put, not whether it blocks. 🟦 goes over in a line; ⚠️ leads with the consequence. Both stop the task until answered.

A blocked task holds itself, not the run. Every ⬜ task whose blockers are settled and whose pull request's criteria are agreed is on the **frontier** and may be taken; the ledger's order says which is preferred.

## 11. Hand back

Report the plan as GitHub will show it: one line per pull request - title,
branch, estimated size against the budget, criteria agreed - with its tasks
beneath it, each with category and model. A pull request whose criteria are
still 📋 holds its tasks off the frontier - name it and what is left to agree.
Name the frontier - every task that could start now - and the model the first one needs, then stop. Do not start it in the same turn.

Say how many questions are open and how many are ⚠️, but **do not ask them yet** - name the task each is attached to instead. If the owner volunteers answers now, take them and record them with their provenance.
