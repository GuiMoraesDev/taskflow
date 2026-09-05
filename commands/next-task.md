---
description: Pick up the next pending task from the plan and run the one-task cycle
argument-hint: "[TASK-ID]"
allowed-tools: Read, Edit, Glob, Grep, Bash
---

Take the task named by `$1`. Without an argument, take the first ⬜ row in
`PROGRESS.md` whose blockers are all settled - and if the frontier holds more
than one, say what else could have been taken.

State the task ID, its category, and the model it declares before anything else.

Then follow the `task-run` skill from step 0, which is the question gate: one
task, presented for review, gated, committed, logged. Stop after it. Do not begin
the next row in the same turn.

Raise **only** the questions this task names in its **Blocked by** line.
Questions attached to later tasks stay unasked, however tempting it is to clear
them in one go.

A 🙋 row is the repo owner's: report what is needed and stop.
