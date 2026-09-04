---
description: Pick up the next pending task from the plan and run the one-task cycle
argument-hint: "[TASK-ID]"
allowed-tools: Read, Edit, Glob, Grep, Bash
---

Take the task named by `$1`, or the first ⬜ row whose blocking open questions are
answered.

Before anything else, state the task ID, its category, and the model it declares.
If the session is on a different model, say so and switch - that is step 0 of the
cycle, not a formality.

Then follow the `task-run` skill: one task, presented for review, gated,
committed, logged. Stop after it. Do not begin the next row in the same turn.

A 🙋 row is the repo owner's: report what is needed and stop.
