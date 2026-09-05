# taskflow

A Claude Code plugin carrying a working method - plan first, one task per commit,
gates before every commit, docs kept true as they change - in a form any repo can
install.

## What is in it

| Kind | Name | Does |
| ---- | ---- | ---- |
| Skill | `init-workflow` | Writes `.claude/workflow.json` from the target repo's real scripts and layout, asks which model takes each tier and whether the repo keeps diagrams, and adds the workflow section to its `CLAUDE.md` |
| Skill | `plan-start` | Scaffolds `SCOPE.md` + `TASKS.md` + `QUESTIONS.md` + `PROGRESS.md`: scope, one-commit tasks with a category and model each, and every open question carrying a recommendation |
| Skill | `task-run` | The per-task cycle - model check, 🔄, change, review, gates, commit, ✅, session log - then stop |
| Skill | `bug-red-test` | Makes a regression test red against the old behaviour before the fix ships |
| Skill | `docs-sync` | The docs checklist, plus the glossary and the diagram sweep when the repo keeps them |
| Skill | `standards-review` | Audits a diff against the standards the repo's `CLAUDE.md` states |
| Agent | `plan-architect` (deep tier) | Surveys the code and returns the task breakdown a plan needs |
| Agent | `gate-runner` (mechanical tier) | Runs lint/types/unit/e2e, reports failures only - keeps passing output out of the main context |
| Agent | `standards-reviewer` (deep tier) | Read-only standards audit of a diff |
| Agent | `docs-diagram-auditor` (surface tier) | Sweeps docs, and diagram labels when there are any, for stale claims |
| Command | `/init-workflow` | Runs the `init-workflow` skill - the deterministic entry point for setting up or reconciling the config |
| Command | `/plan-status` | The ledger, unanswered questions and what they block, last log entries, next actionable task |
| Command | `/next-task` | Picks the next ⬜ row and runs the cycle on it |
| Command | `/deviation` | Appends a departure from the plan to the session log |
| Hooks | `guard-bash`, `guard-edit`, `progress-reminder` | Block `--no-verify`, `git add -A`, bare `npx`-style gate invocations, auto-branching, force pushes, test-runner-config edits and dependency overrides; remind to close the task row after a commit |

## The portability seam

Everything repo-specific lives in one file the target repo owns:
`.claude/workflow.json` - gate commands, the plan folder, which paths need e2e,
the docs checklist, where decision records and the glossary live, whether
diagrams are kept, and which model each difficulty tier runs on. `examples/workflow.example.json` is the shape; `init-workflow`
fills it in by reading the repo and asking what it cannot read. The plugin
carries the procedure, `CLAUDE.md` and `workflow.json` carry the repo's rules.

The tier mapping binds both task rows and the plugin's own agents, so a repo sets
its cost and latency budget once.

What does **not** travel: dependency-direction rules belong in the target repo's
lint config, not in prose. A prose invariant rots.

## Install

```bash
/plugin marketplace add /path/to/taskflow
/plugin install taskflow@taskflow-tools
```

Then run `/init-workflow` in the target repo, and `/plan-status` to check it
took.

To install from git rather than a local path, push this folder to its own
repository and add that URL instead.

## The method, in one screen

1. No code before the four plan docs exist. `SCOPE.md` names what may change and
   the tempting things that may not, `TASKS.md` holds the work, `QUESTIONS.md`
   holds what is undecided, `PROGRESS.md` is the ledger.
2. One task is one commit, cut vertically so finishing it makes something
   observably true. Each declares a category, the tier that must take it, its
   files, and how it will be verified. A wide mechanical change is sequenced
   expand, migrate, contract rather than forced into slices that cannot go green.
3. Questions are for decisions only - anything the repo can answer, the agent
   reads for itself. Each carries a recommendation and is asked at the task that
   needs it, not up front. An unanswered question blocks that task; the
   recommendation makes the answer cheap rather than standing in for one. Hard or
   security-bearing questions are put with their consequences stated plainly.
4. Apply one task, present it, gate it, commit it, log it. Then stop.
5. A bug fix ships a test watched failing against the old behaviour.
6. The docs checklist is walked before a behaviour change is called done - with
   the diagrams in the same pass, in a repo that keeps them.
7. A departure from the plan is written down, in both directions - the plan is
   evidence of what was expected, the log is evidence of what was true.
