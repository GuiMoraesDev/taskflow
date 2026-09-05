# Progress — <Short Title>

Status: ⬜ pending · 🔄 in progress · ✅ done · ⚠️ partial · ❌ skipped · 🚧 blocked
Category: 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation · ❓ question
Model: 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human

One ledger, in execution order. **Questions sit in the row immediately above the
task they block**, owned by 🙋 the repo owner, so the order of the table is the
order things are needed.

| ID     | Category    | Owner     | Summary                             | Status                |
| ------ | ----------- | --------- | ----------------------------------- | --------------------- |
| TASK-1 | 🔴 Bug      | 🧠 Opus   | Short description                   | ⬜ pending            |
| Q1     | ❓ 🟦        | 🙋 Owner  | Short question — blocks TASK-2      | ⬜ unanswered         |
| TASK-2 | 🟡 Refactor | ⚙️ Sonnet | Short description                   | 🚧 blocked on Q1      |
| Q2     | ❓ ⚠️        | 🙋 Owner  | Short question — blocks TASK-5      | 🚧 blocking TASK-5    |
| TASK-5 | 🟡 Refactor | ⚙️ Sonnet | Short description                   | 🚧 blocked on Q2      |
| Q3     | ❓ 🟦        | 🙋 Owner  | Short question — blocks TASK-7      | ✅ answered: **B**    |
| TASK-7 | 🟢 Chore    | 🙋 Owner  | A step only the owner can do        | ⬜ pending            |

The full text of each question - options, consequences, recommendation - lives in
`QUESTIONS.md`. This table carries the position and the state, not the argument.

## How question rows move

- **Ask late.** A ❓ row is put to the owner when the run reaches the task below
  it, never at the top of the session. A plan does not open with an interrogation.
- **Accept early.** If the owner answers before it is asked, record the decision
  in `QUESTIONS.md` and flip the row to ✅ the moment it is said. Never re-ask a
  question that already has an answer.
- **Unanswered when its task comes up:** the row goes 🚧 and so does the task.
  The task does not start. Put the question to the owner - with its consequences
  when it is ⚠️ - and wait for a real answer.
- **An answer that does not settle it** - ambiguous, or it opens something the
  plan did not consider - leaves the row 🚧. Guessing at an owner's half-answer
  is worse than asking twice.

Nothing here defaults through. A recommendation exists so the owner can answer in
one word, not so the run can proceed without them - a plan that decides its own
open questions was never blocked by them.

## The frontier

The **frontier** is every ⬜ task whose blockers are all settled: the work that
could be picked up right now. A blocked task holds itself, not the run - if
another task is independent of the open question, it is on the frontier and may
be taken.

The ledger's order is the intended order, so the top of the frontier is the
default choice. Taking a different one is a fine call to make out loud: say which
row you are taking and which blocked row you are stepping past, and leave the
ledger's order alone. Reordering hides the fact that something is stuck.

When the frontier is empty and the plan is not finished, every remaining task is
waiting on the owner. Say exactly that, and list what they owe.

Record the model that turned out true - a task planned 🔧 and applied on ⚙️ is a
deviation for the session log.

---

## Session Log

One entry per applied task, appended as work lands. Name the commit hash, say
what actually changed, and record anything that turned out differently from the
plan. Answered questions get an entry too - the decision is part of the history
of the work.

**YYYY-MM-DD** — Q1 answered: **A**, by the owner at the gate. One line on their
reasoning. Note here when a decision was graduated to the repo's decision record,
and where it landed.

**YYYY-MM-DD** — TASK-1 applied (`abc1234`). What changed, in a sentence or two.
For a bug: what the defect actually was, and confirmation that the regression
test was verified failing against the old behaviour. 42 unit / 7 e2e green.

**YYYY-MM-DD** — TASK-2 applied (`def5678`). **Deviation:** the plan called for
X, but Y turned out to be true, so this does Z instead. Deviations belong here
whether they made the task bigger or smaller.
