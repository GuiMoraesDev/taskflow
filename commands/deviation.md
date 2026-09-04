---
description: Record a departure from the plan in the session log
argument-hint: "<what turned out differently>"
allowed-tools: Read, Edit, Glob, Bash
---

Append a session-log entry to the active `PROGRESS.md` recording: `$1`

Shape it as: today's date, the task ID, the commit hash if one has landed, then
**Deviation:** what the plan called for, what turned out to be true, and what was
done instead.

Both directions count - a task that turned out unnecessary and a task that had to
do more than it said are equally worth writing down.

If the deviation changes the task's outcome, update its status marker too: ⚠️ for
partial (say what was left out), ❌ for skipped (say why).

Write it in the register of a committed doc: state what is true, not the
conversation that produced it.
