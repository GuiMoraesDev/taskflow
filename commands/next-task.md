---
description: Pick up the next pending task from the plan and run the one-task cycle
argument-hint: "[TASK-ID]"
allowed-tools: Read, Edit, Glob, Grep, Bash
---

Take the task named by `$1`, or the first ⬜ row in `PROGRESS.md` that is not
blocked.

Before anything else, state the task ID, its category, and the model it declares.
If the session is on a different model, say so and switch - that is step 1 of the
cycle, not a formality.

Then run the question gate, which is step 0. Read the task's **Blocked by** line
in `TASKS.md` and settle each question it names against `QUESTIONS.md`:

- Answered already - proceed, and do not re-ask it.
- 🟦 unanswered - apply the recommendation, record it as _applied by default_,
  and say so.
- ⚠️ unanswered - stop. Put it to the owner leading with the consequence, mark
  the rows 🚧, and go no further.
- Answered but still ambiguous - stop. Say what is undetermined rather than
  inferring the rest.

Raise **only** the questions this task needs. Questions attached to later tasks
stay unasked, however tempting it is to clear them in one go. If the owner has
answered something ahead of time, write it into `QUESTIONS.md` and flip its row
before continuing.

Then follow the `task-run` skill: one task, presented for review, gated,
committed, logged. Stop after it. Do not begin the next row in the same turn.

A 🙋 row is the repo owner's: report what is needed and stop.
