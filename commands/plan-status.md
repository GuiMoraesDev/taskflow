---
description: Show the current plan's task table, open questions and last session-log entries
argument-hint: "[project-name]"
allowed-tools: Read, Glob, Bash
---

Find the active plan under the `projectsDir` from `.claude/workflow.json`. With
an argument, use `<projectsDir>/$1/`. Without one, use the folder whose
`PROGRESS.md` was modified most recently; if several are close, list them and ask.

Report, and nothing else:

1. The task table as it stands, with a count line: `n done · n in progress · n pending`.
2. Any **unanswered** open question, and which task it blocks.
3. The last three session-log entries, one line each.
4. The next actionable task - the first ⬜ whose blockers are answered - and the
   model it declares. Do not start it.

If a row is 🔄 and the tree is clean with a commit since it was marked, flag it:
the marker was probably never flipped to ✅.
