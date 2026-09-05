---
description: Show the current plan's task table, open questions and last session-log entries
argument-hint: "[project-name]"
allowed-tools: Read, Glob, Bash
---

Find the active plan under the `projectsDir` from `.claude/workflow.json`. With
an argument, use `<projectsDir>/$1/`. Without one, use the folder whose
`PROGRESS.md` was modified most recently; if several are close, list them and ask.

Read `PROGRESS.md` for state and `QUESTIONS.md` for the questions themselves.

Report, and nothing else:

1. The ledger as it stands, questions in their positions, with a count line:
   `n done · n in progress · n pending · n blocked`.
2. Any **unanswered** open question: its ID, its mark, the task it blocks, and
   its recommendation in one line. Every one of them is holding its task, so say
   which tasks are unreachable until they are answered. Flag the ⚠️ ones
   separately - those are the ones whose consequences the owner has to weigh.
3. The last three session-log entries, one line each.
4. The **frontier**: every ⬜ task whose blockers are settled, with the model each
   declares. The ledger's order says which is preferred, so list that one first.
   Do not start any of them.

   When the frontier is empty and the plan is unfinished, say so plainly - every
   remaining task is waiting on the owner - and list what they owe.

This is a status report, not the question gate. Listing an open question here is
not asking it: do not press the owner for an answer to a question whose task is
not next, and do not apply any recommendation. If they answer one anyway, record
it in `QUESTIONS.md` and flip its row.

If a row is 🔄 and the tree is clean with a commit since it was marked, flag it:
the marker was probably never flipped to ✅.
