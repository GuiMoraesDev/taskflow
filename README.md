# Taskflow

[![release](https://img.shields.io/github/v/release/GuiMoraesDev/taskflow?label=release)](https://github.com/GuiMoraesDev/taskflow/releases)
[![claude code](https://img.shields.io/badge/claude%20code-plugin-D97757?logo=claude)](https://docs.claude.com/en/docs/claude-code/plugins)
[![python](https://img.shields.io/badge/python-3-3776AB?logo=python)](https://www.python.org/downloads/)
[![github cli](https://img.shields.io/badge/gh-cli-181717?logo=github)](https://cli.github.com/)
</br>
<small>Every badge is a link to its docs</small>

</br>

## Description of that project 📖

Taskflow is a [Claude Code](https://docs.claude.com/en/docs/claude-code) plugin that
gives Claude a disciplined way to ship work, the way a careful senior dev would:

- 🗺️ **Plan first.** Work is planned as the pull requests you will review, each one about one topic and under a line budget.
- ✅ **Agree what "done" means.** Each pull request gets acceptance criteria you sign off on before any code is written.
- 🔴🟢 **Red before green.** You see the tests fail for the right reason before Claude writes the implementation.
- 📦 **One task, one commit.** Claude does a single task end to end, then stops.
- 🚦 **Gates before every commit.** Lint, type check, unit tests, and e2e when the change needs them.
- 📚 **Docs stay true.** The docs, and the diagrams if your repo has them, are checked before a change counts as done.

The plugin carries the procedure. Your repo keeps its own rules in `CLAUDE.md` and
`.claude/workflow.json`.

## Requirements 🛑

To use it, you will need these tools in your environment:

- [Claude Code](https://docs.claude.com/en/docs/claude-code/setup)
- [Python 3](https://www.python.org/downloads/) on your `PATH`, because the hooks are Python scripts
- [Git](https://git-scm.com/downloads) and the [GitHub CLI](https://cli.github.com/), signed in to your repo's remote, because Taskflow opens and updates your pull requests
- Lint, type check and test commands your repo can already run

## Installing the plugin 🧰

Add the marketplace and install the plugin from inside Claude Code:

```sh
/plugin marketplace add GuiMoraesDev/taskflow
/plugin install taskflow@taskflow-tools
```

Then, in the repo you want to use it on:

```sh
/init-workflow      # writes .claude/workflow.json and the workflow section of CLAUDE.md
/plan-status        # checks that the config works
```

> 💡 To install from a local checkout instead, pass its path to `/plugin marketplace add`.

## How a piece of work flows 🔁

```
  plan  ──▶  agree criteria  ──▶  run a task  ──▶  repeat  ──▶  check in
```

1. **Plan.** Ask for one, like _"plan the export feature"_. Claude grills you on the
   design until you both agree, then writes `SCOPE.md`, `TASKS.md`, `QUESTIONS.md`
   and `PROGRESS.md` in your configured `projectsDir`.
2. **Agree the criteria.** Settle each pull request's acceptance criteria before its
   first task starts.
3. **Run a task.** `/next-task` picks the first task that isn't blocked (or use
   `/next-task TASK-3` to pick one). Claude runs the full cycle: branch, failing tests,
   implementation, a review of the logic with you, gates, size check, commit, push and
   log. Then it stops.
4. **Repeat.** The first task of a pull request opens it as a draft, and the last task
   marks it ready for review.
5. **Check in.** `/plan-status` shows where you are, the open questions and what they
   block. `/deviation` writes down anything that didn't go as planned.

## What's inside 🎁

### Commands

| Command | What it does |
| --- | --- |
| `/init-workflow` | Sets up or updates the workflow config for your repo |
| `/plan-status [project]` | Shows the task list, open questions, latest log entries and the next task you can do |
| `/next-task [TASK-ID]` | Picks the next task, or the one you name, and runs the cycle on it |
| `/deviation <what changed>` | Logs a change from the plan |

### Skills

| Skill | What it does |
| --- | --- |
| `init-workflow` | Reads your repo's scripts and layout, asks what it can't figure out (models, diagrams, pull-request conventions), then writes `.claude/workflow.json` and the workflow section of `CLAUDE.md`. Running it again asks only about what changed |
| `plan-start` | Grills you on the design, then writes the four plan docs: the scope, the pull requests, their acceptance criteria, one-commit tasks with their tests, and the open questions, each with a recommendation |
| `task-run` | Runs one task through the full cycle, from the failing tests to the commit and pull request, then stops |
| `bug-red-test` | Proves a regression test fails against the old behaviour before the fix ships |
| `docs-sync` | Goes through your docs checklist, plus the glossary and diagrams if your repo has them |
| `standards-review` | Checks a diff against the standards in your `CLAUDE.md`, and warns you when a test was bent to pass instead of updated with the behaviour |

### Agents

| Agent | Tier | What it does |
| --- | --- | --- |
| `plan-architect` | deep | Surveys the code and returns the task breakdown a plan needs |
| `standards-reviewer` | deep | Audits a diff against the standards without changing anything |
| `docs-diagram-auditor` | surface | Looks for outdated claims in the docs and diagram labels |
| `gate-runner` | mechanical | Runs lint, types, unit and e2e tests and reports only the failures |

### Hooks

| Hook | What it does |
| --- | --- |
| `guard-bash` | Asks before risky commands: `--no-verify`, `git add -A`, bare `npx`-style gate calls, automatic branching and force flags. It refuses a force flag unless you give a reason |
| `guard-signature` | Blocks AI signatures (like `Co-Authored-By` for an AI) in commits and pull requests unless `workflow.json` sets `aiSignature: true`. It's `false` by default |
| `progress-reminder` | After a commit, reminds you to close the task in `PROGRESS.md` |
| `version-bump` | In a repo that ships `.claude-plugin/plugin.json`, bumps the patch version on a branch's first commit and blocks a push that didn't bump it |

## Configuration ⚙️

Everything specific to your repo lives in one file you own: `.claude/workflow.json`.
`/init-workflow` fills it in for you. See
[`examples/workflow.example.json`](examples/workflow.example.json) for the full shape.

| Key | What it holds |
| --- | --- |
| `projectsDir` | Where plan folders live |
| `gates` | Your lint, types, unit and e2e commands |
| `e2eTriggerPaths` | File patterns whose changes make the e2e suite run |
| `docsChecklist` | Each doc and what it covers, checked before a behaviour change is done |
| `decisions` | Where your decision records and glossary live |
| `diagrams` | Whether you keep diagrams, where, in what format and who edits them |
| `pullRequests` | Line budget and the paths it skips, branch and title prefixes, labels, assignee, stacking and whether independent pull requests run in parallel |
| `aiSignature` | Whether commits and pull requests may carry an AI signature |
| `commitTypes` | The allowed conventional-commit types |
| `models` | Which model each tier uses, e.g. `{ "deep": "opus", "surface": "sonnet", "mechanical": "haiku" }` |

> 💡 The `models` mapping covers both your plan's tasks and the plugin's own agents, so you set your cost and speed trade-off once.

Rules about dependency direction belong in your repo's lint config, not in this file.
Prose rules go stale; lint rules don't.

## The rules it follows 📏

1. **No code before the plan.** `SCOPE.md` says what may change and what may not, `TASKS.md` holds the work, `QUESTIONS.md` holds the open decisions and `PROGRESS.md` tracks progress.
2. **Plans are pull requests.** Each one has one topic and stays under the line budget (400 changed lines by default, tests not counted). Its title, branch, commits and files are written down before any of them exist.
3. **Criteria come first.** Each pull request's acceptance criteria are agreed with you before its tasks start.
4. **One task, one commit.** Each task makes something visibly true and lists its category, model tier, files and tests. A wide mechanical change is done as expand, migrate, contract.
5. **Only real decisions become questions.** Claude reads the repo for anything it can answer itself. Each question comes with a recommendation, examples, cost and how to undo it. It is asked at the task that needs it, and it blocks only that task.
6. **Tests before code.** You see the tests and why they matter, watch them fail, then Claude implements until they pass without touching them. Claude then walks you through the logic it wrote until you understand the code. Nothing reaches the default branch without a reviewed pull request.
7. **No test? Say why.** A task without a new test explains why: it changes no behaviour and the existing tests cover it. A bug fix's test targets how the bug happens.
8. **Docs before done.** The docs checklist, and the diagrams if your repo keeps them, are checked before a behaviour change is called done.
9. **Write down surprises.** Any change from the plan goes in the log. The plan shows what you expected, the log shows what happened.

## Project Maintenance 👨‍🔧

- The plugin follows the [Claude Code plugin structure](https://docs.claude.com/en/docs/claude-code/plugins): `skills/`, `agents/`, `commands/` and `hooks/` at the root, with the manifest and marketplace entry in `.claude-plugin/`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- With the plugin installed while you work on it, its `version-bump` hook bumps the patch version in `plugin.json` on a branch's first commit and blocks a push that didn't bump it.
- When a pull request merges into `main`, the [`Release`](.github/workflows/release.yml) workflow tags the merge commit `v<version>` and publishes a GitHub release.
