# taskflow

A plan-and-task workflow for Claude Code: scope, tasks, questions and progress
scaffolding split into pull requests under a line budget, acceptance criteria
agreed up front, tests red before green, one task per commit, questions answered
at the task that needs them, red-first bug fixes, docs-and-diagram sync and a
standards review.

## Commands

- `/deviation` - record a departure from the plan in the session log
- `/init-workflow` - set up or reconcile `.claude/workflow.json`
- `/next-task` - pick up the next pending task and run the one-task cycle
- `/plan-status` - show the task table, open questions and the latest log entries
- `/review-feedback` - judge a pull request's review comments and suggest a process change

## Skills

- `plan-start` - scaffold SCOPE.md, TASKS.md, QUESTIONS.md and PROGRESS.md
- `task-run` - apply one task through the full cycle
- `bug-red-test` - prove a regression test fails against the old behaviour
- `docs-sync` - check the docs and diagrams still describe the code
- `standards-review` - audit a diff against the repo's CLAUDE.md standards
- `init-workflow` - write the workflow config and CLAUDE.md section

## Agents

- `plan-architect` - surveys the code a piece of work touches and drafts the plan
- `gate-runner` - runs the quality gates and reports only failures
- `pr-reviewer` - reviews a pull request against its acceptance criteria
- `standards-reviewer` - audits a diff against the documented standards
- `docs-diagram-auditor` - sweeps the docs and diagrams for stale claims

## This variant

This is the directory build of taskflow. It ships no hooks and no scripts: the
commit, signature, size and version rules are procedures Claude follows rather
than checks a hook enforces. For the guards, install the full plugin:

```
/plugin marketplace add GuiMoraesDev/taskflow
/plugin install taskflow@taskflow-tools
```
