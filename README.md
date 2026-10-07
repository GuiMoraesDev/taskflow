# taskflow

A Claude Code plugin carrying a working method - plan first in pull requests the
owner will review, acceptance criteria agreed before code, tests watched red
before they go green, one task per commit, gates before every commit, docs kept
true as they change - in a form any repo can install.

## What is in it

| Kind | Name | Does |
| ---- | ---- | ---- |
| Skill | `init-workflow` | Writes `.claude/workflow.json` from the target repo's real scripts and layout, asks which model takes each tier and whether the repo keeps diagrams, and adds the workflow section to its `CLAUDE.md` |
| Skill | `plan-start` | Grills the owner over the design tree of the work in rounds until you share an understanding, then scaffolds `SCOPE.md` + `TASKS.md` + `QUESTIONS.md` + `PROGRESS.md`: scope, pull requests of one topic under the line budget, acceptance criteria agreed with the owner per pull request, one-commit tasks with a category, model and red-first tests each, and every open question carrying a recommendation |
| Skill | `task-run` | The per-task cycle - criteria and question gate, the pull request's branch, 🔄, tests shown and run red, implementation to green in a subagent on the task's model, review, gates, size check, commit, draft or ready pull request, ✅, session log - then stop |
| Skill | `bug-red-test` | Makes a regression test red against the old behaviour before the fix ships |
| Skill | `docs-sync` | The docs checklist, plus the glossary and the diagram sweep when the repo keeps them |
| Skill | `standards-review` | Audits a diff against the standards the repo's `CLAUDE.md` states, and alerts when a test was bent to pass rather than changed with the behaviour - naming the coverage lost and the behaviour put at risk |
| Agent | `plan-architect` (deep tier) | Surveys the code and returns the task breakdown a plan needs |
| Agent | `gate-runner` (mechanical tier) | Runs lint/types/unit/e2e, reports failures only - keeps passing output out of the main context |
| Agent | `standards-reviewer` (deep tier) | Read-only standards audit of a diff |
| Agent | `docs-diagram-auditor` (surface tier) | Sweeps docs, and diagram labels when there are any, for stale claims |
| Command | `/init-workflow` | Runs the `init-workflow` skill - the deterministic entry point for setting up or reconciling the config |
| Command | `/plan-status` | The ledger, unanswered questions and what they block, last log entries, next actionable task |
| Command | `/next-task` | Picks the next ⬜ row and runs the cycle on it |
| Command | `/deviation` | Appends a departure from the plan to the session log |
| Hooks | `guard-bash`, `guard-edit`, `progress-reminder` | Ask before `--no-verify`, `git add -A`, bare `npx`-style gate invocations, auto-branching, git force flags (refused without a stated reason), test-runner-config edits and dependency overrides - every matching rule is listed in one prompt, force first; remind to close the task row after a commit |
| Hook | `guard-signature` | Refuses a commit or pull request carrying an AI signature (`Co-Authored-By` for an AI, "Generated with Claude Code") unless `workflow.json` sets `aiSignature: true` - it defaults to `false` |
| Hook | `version-bump` | In a repo that ships `.claude-plugin/plugin.json`: bumps the patch version and stages it on the branch's first commit, and refuses a push whose version is not above the remote default branch's |

## The portability seam

Everything repo-specific lives in one file the target repo owns:
`.claude/workflow.json` - gate commands, the plan folder, which paths need e2e,
the docs checklist, the pull request line budget, where decision records and the glossary live, whether
diagrams are kept, whether commits carry an AI signature, and which model each difficulty tier runs on. `examples/workflow.example.json` is the shape; `init-workflow`
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
2. The plan is written as the pull requests the owner will review on GitHub:
   one topic each, under 400 changed lines not counting tests, each saying its
   title, branch, commits and files before any exist.
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
   Review it, gate it, check the pull request's size, commit it, push it - the
   first task opens a draft, the last marks it ready - log it. Then stop.
   Nothing reaches the default branch without a reviewed pull request.
7. A task with no new test says why: it changes no behaviour, and the existing
   suite proves it. A bug fix's test is written against the bug's mechanism.
8. The docs checklist is walked before a behaviour change is called done - with
   the diagrams in the same pass, in a repo that keeps them.
9. A departure from the plan is written down, in both directions - the plan is
   evidence of what was expected, the log is evidence of what was true.
