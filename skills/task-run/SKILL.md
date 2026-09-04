---
name: task-run
description: Apply exactly one task from PLAN.md through the full cycle - model check, mark in progress, change, review, gates, commit, session log - then stop. Use when the user says "do TASK-3", "next task", "continue the plan", or approves a task for implementation.
---

# task-run

One task. Then stop. Batching several tasks into one review is the failure this
whole cycle exists to prevent.

## The cycle

```
0. Switch to the model the task declares      ← not optional
1. Mark the row 🔄 in PROGRESS.md
2. Apply the change
3. Present the diff for review  ──► changes requested? revise, back to 3
4. Run the gates                ──► any fail? fix, re-run
5. Draft the commit message, present it ──► approved? commit
6. Mark ✅ and append a session-log entry naming the hash
7. Ask: push now, or next task?
```

## Step 0 - the model

The task's declared model binds the runner. If the session is on a different one,
say so and switch before touching the task. A task applied on the wrong model is
a deviation for the session log even when the diff is fine.

🙋 rows are the repo owner's. Do not attempt them - report what is needed.

## Step 2 - the change

Scope is the task's `Files` list. Reaching further is a deviation, not a bonus:
do the useful thing, then write down that you did.

🔴 bug tasks route through the `bug-red-test` skill before the gates. A bug fix
without a test verified failing against the old behaviour is not done.

## Step 4 - the gates

Run the commands in `.claude/workflow.json` `gates`, in order: lint → types →
unit, plus e2e when the diff touches `e2eTriggerPaths`. Use the repo's scripts,
never the underlying binary directly.

Delegate the run to the `gate-runner` agent, spawned with `model` set to
`models.mechanical` from the config - it reports failures, not thousands of lines
of passing output.

If lint fixed files, those changes go in the same commit.

A task that touches behaviour also owes the docs checklist. Run `docs-sync`
before calling the task done.

## Step 5 - the commit

```
<type>: <short imperative description>

[body only when the why is not obvious from the diff]
```

Types come from `.claude/workflow.json` `commitTypes`. Scope the type to the
change: a task that moves files **and** fixes a defect is a `fix`, not a
`refactor` - the defect is the part a reader needs to find later.

- Stage an explicit pathspec. Never `git add -A` or `git add .` - the tree usually
  holds unrelated local files.
- Never `--no-verify`. Let the pre-commit hook run.
- Commit to the current branch. Branch creation is the repo owner's call.
- The message states the change, not the conversation that produced it. No
  "as requested", no "previously X now Y", and never a reference to PLAN.md or
  PROGRESS.md - they are gitignored, so the citation points at nothing.

## Step 6 - the log

Flip the row to ✅ immediately after the commit lands, and append one session-log
entry: the hash, what actually changed, the suite counts, and any **deviation**.

Both directions of deviation count. A task that turned out unnecessary and a task
that had to do more than it said are equally worth writing down - the plan is
evidence of what was expected, the log is evidence of what was true.

⚠️ partial and ❌ skipped are legitimate outcomes. Say what was left out and why;
never mark ✅ on a partial.
