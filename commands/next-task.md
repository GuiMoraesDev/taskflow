---
description: Pick up the next pending task from the plan and run the one-task cycle
argument-hint: "[TASK-ID]"
allowed-tools: Read, Edit, Glob, Grep, Bash
---

Take the task named by `$1`. Without an argument, take the first ⬜ task row in
`PROGRESS.md` whose blockers are all settled and whose pull request's acceptance
criteria are agreed - and if the frontier holds more
than one, say what else could have been taken.

State the task ID, its pull request, its category, and the model it declares
before anything else.

Then follow the `task-run` skill from step 0, which is the gate: one task, on
its pull request's branch, tests written and shown red before a subagent on its
model implements them green, presented for review, gated, size-checked,
committed, pushed to its draft or ready pull request, logged. Stop after it. Do not begin
the next row in the same turn.

When `.claude/workflow.json` sets `pullRequests.parallel: true` and no `$1` is
given, take one frontier task from each independent pull request instead - no
**Depends on** between them, not on one stack, no shared file - and run them
through the skill's **Parallel pull requests** section. Name every task taken,
with its pull request and model, before starting.

Raise **only** the questions this task names in its **Blocked by** line.
Questions attached to later tasks stay unasked, however tempting it is to clear
them in one go.

A 🙋 row is the repo owner's: report what is needed and stop.
