# taskflow

A Claude Code plugin carrying a working method - plan first in pull requests the
owner will review, acceptance criteria agreed before code, tests watched red
before they go green, one task per commit, gates before every commit, docs kept
true as they change - in a form any repo can install.

The plugin carries the procedure. The target repo keeps its own rules in
`CLAUDE.md` and `.claude/workflow.json`.

## Quick start

```bash
/plugin marketplace add GuiMoraesDev/taskflow
/plugin install taskflow@taskflow-tools
```

Then, in the target repo:

```bash
/init-workflow      # writes .claude/workflow.json and the CLAUDE.md workflow section
/plan-status        # confirms the config took
```

To install from a local checkout instead, pass its path to
`/plugin marketplace add`.

### Requirements

- `python3` on the `PATH` - the hooks are Python scripts
- `git`, and the `gh` CLI authenticated against the repo's remote - `task-run`
  opens and updates the pull requests
- Gate commands (lint, types, unit, e2e) the repo can already run

## A piece of work, end to end

1. **Plan.** Ask for a plan ("plan the export feature"). `plan-start` grills you
   over the design until you agree on it, then writes `SCOPE.md`, `TASKS.md`,
   `QUESTIONS.md` and `PROGRESS.md` under the configured `projectsDir`.
2. **Agree the criteria.** Each pull request in the plan carries acceptance
   criteria. Settle them before its first task starts.
3. **Run a task.** `/next-task` takes the first unblocked ⬜ row (or
   `/next-task TASK-3` takes a named one) and runs the `task-run` cycle: branch,
   tests shown red, implementation green in a subagent, a grilling over the logic
   written, review, gates, size check, commit, push, log. Then it stops.
4. **Repeat.** The first task of a pull request opens it as a draft; the last
   marks it ready for review.
5. **Check in.** `/plan-status` shows the ledger, the open questions and what
   they block, and the next actionable task. `/deviation` records anything that
   turned out differently from the plan.

## What is in it

### Skills

| Name | Does |
| ---- | ---- |
| `init-workflow` | Writes `.claude/workflow.json` from the target repo's real scripts and layout, asks which model takes each tier, whether the repo keeps diagrams and its pull-request conventions, and adds the workflow section to its `CLAUDE.md`. A re-run reports drift and asks only about what changed |
| `plan-start` | Grills the owner over the design tree in rounds until both share an understanding, then scaffolds the four plan docs: scope, pull requests of one topic under the line budget, acceptance criteria per pull request, one-commit tasks with a category, model and red-first tests each, and every open question carrying a recommendation |
| `task-run` | The per-task cycle - criteria and question gate, the pull request's branch, 🔄, tests shown and run red, implementation to green in a subagent on the task's model, the owner grilled over the tests and the domain logic written, review, gates, size check, commit, draft or ready pull request, ✅, session log - then stop |
| `bug-red-test` | Makes a regression test red against the old behaviour before the fix ships |
| `docs-sync` | Walks the docs checklist, plus the glossary and the diagram sweep when the repo keeps them |
| `standards-review` | Audits a diff against the standards the repo's `CLAUDE.md` states, and alerts when a test was bent to pass rather than changed with the behaviour - naming the coverage lost and the behaviour put at risk |

### Agents

| Name | Tier | Does |
| ---- | ---- | ---- |
| `plan-architect` | deep | Surveys the code and returns the task breakdown a plan needs |
| `standards-reviewer` | deep | Read-only standards audit of a diff |
| `docs-diagram-auditor` | surface | Sweeps docs, and diagram labels when there are any, for stale claims |
| `gate-runner` | mechanical | Runs lint/types/unit/e2e and reports failures only, keeping passing output out of the main context |

### Commands

| Name | Does |
| ---- | ---- |
| `/init-workflow` | Runs the `init-workflow` skill - the deterministic entry point for setting up or reconciling the config |
| `/plan-status [project]` | The ledger, unanswered questions and what they block, last log entries, next actionable task |
| `/next-task [TASK-ID]` | Picks the next ⬜ row, or the one named, and runs the cycle on it |
| `/deviation <what changed>` | Appends a departure from the plan to the session log |

### Hooks

| Name | Does |
| ---- | ---- |
| `guard-bash` | Asks before `--no-verify`, `git add -A`, bare `npx`-style gate invocations, auto-branching and git force flags (refused without a stated reason). Every matching rule is listed in one prompt, force first |
| `guard-signature` | Refuses a commit or pull request carrying an AI signature (`Co-Authored-By` for an AI, "Generated with Claude Code") unless `workflow.json` sets `aiSignature: true`. It defaults to `false` |
| `progress-reminder` | After a commit, reminds to close the task row in `PROGRESS.md` |
| `version-bump` | In a repo that ships `.claude-plugin/plugin.json`: bumps the patch version and stages it on the branch's first commit, and refuses a push whose version is not above the remote default branch's |

## Configuration

Everything repo-specific lives in one file the target repo owns,
`.claude/workflow.json`. `init-workflow` fills it in by reading the repo and
asking what it cannot read. [`examples/workflow.example.json`](examples/workflow.example.json)
is the full shape.

| Key | Holds |
| --- | ----- |
| `projectsDir` | Where plan folders live |
| `gates` | The lint, types, unit and e2e commands |
| `e2eTriggerPaths` | Globs whose change makes the e2e suite run |
| `docsChecklist` | Each doc and what it owns, walked before a behaviour change is done |
| `decisions` | Where decision records and the glossary live |
| `diagrams` | Whether diagrams are kept, where, in what format, and who edits them |
| `pullRequests` | The changed-line budget and the paths it does not count, the branch and title prefixes, the labels and what to do when one is missing, whether the owner is assigned, the stacking tool and how much of a plan it stacks, and whether independent pull requests run in parallel |
| `aiSignature` | Whether commits and pull requests may carry an AI signature |
| `commitTypes` | The allowed conventional-commit types |
| `models` | Which model each tier runs on, e.g. `{ "deep": "opus", "surface": "sonnet", "mechanical": "haiku" }` |

The tier mapping binds both task rows and the plugin's own agents, so a repo sets
its cost and latency budget once.

What does **not** travel: dependency-direction rules belong in the target repo's
lint config, not in prose. A prose invariant rots.

## The method, in one screen

1. No code before the four plan docs exist. `SCOPE.md` names what may change and
   the tempting things that may not, `TASKS.md` holds the work, `QUESTIONS.md`
   holds what is undecided, `PROGRESS.md` is the ledger.
2. The plan is written as the pull requests the owner will review on GitHub:
   one topic each, under the line budget (400 changed lines by default, not
   counting tests), each saying its title, branch, commits and files before any
   exist.
3. Each pull request carries acceptance criteria, discussed with the owner until
   they agree, before any of its tasks start.
4. One task is one commit, cut vertically so finishing it makes something
   observably true. Each declares a category, the tier that must take it, its
   files, and the tests it adds - each tied to a criterion. A wide mechanical
   change is sequenced expand, migrate, contract rather than forced into slices
   that cannot go green.
5. Questions are for decisions only - anything the repo can answer, the agent
   reads for itself. Each carries a recommendation that explains itself - why,
   a concrete example per option, the cost, how to reverse it - and is asked at
   the task that needs it, not up front. An answered question is marked ✅ the
   moment the answer arrives. An unanswered question blocks that task; the
   recommendation makes the answer cheap rather than standing in for one. Hard or
   security-bearing questions are put with their consequences stated plainly.
6. Apply one task - on its pull request's branch, through a subagent on the
   task's model. Show the owner its tests and why each matters, watch them fail
   for the right reason, then implement until they pass without touching them.
   Grill the owner over the domain logic it wrote until their understanding of
   the code matches the code, and record the behaviour they agreed. Review it,
   gate it, check the pull request's size, commit it, push it - the first task
   opens a draft, the last marks it ready - log it. Then stop. Nothing reaches
   the default branch without a reviewed pull request.
7. A task with no new test says why: it changes no behaviour, and the existing
   suite proves it. A bug fix's test is written against the bug's mechanism.
8. The docs checklist is walked before a behaviour change is called done - with
   the diagrams in the same pass, in a repo that keeps them.
9. A departure from the plan is written down, in both directions - the plan is
   evidence of what was expected, the log is evidence of what was true.

## Developing the plugin

The layout follows the Claude Code plugin structure: `skills/`, `agents/`,
`commands/` and `hooks/` at the root, with the manifest and marketplace entry in
`.claude-plugin/`. With the plugin installed while working on it, its own
`version-bump` hook bumps the patch version in `plugin.json` on a branch's first
commit, and refuses a push that did not bump it.
