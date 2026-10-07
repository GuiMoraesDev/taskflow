---
name: init-workflow
description: Set up the plan-and-task workflow in a repo that does not have it yet - writes .claude/workflow.json from the repo's real scripts and layout, asks which model takes each difficulty tier and the pull-request conventions (branch and title prefixes, labels, assignee, stacking, parallel runs), and adds the workflow section to CLAUDE.md. Use when installing this plugin into a new project, or when the gate commands, the model tiers or the docs checklist have drifted. Safe to re-run - an existing config is reconciled, never overwritten.
---

# init-workflow

Every other skill in this plugin reads `.claude/workflow.json`. This skill writes it.

## 0. If the config already exists, this is a re-run

Read `.claude/workflow.json` before anything else. When it is there, the owner
has already answered - **never re-ask from scratch and never silently
overwrite.**

Run the detection in step 1 anyway, then report the file's current values beside
what you found, and ask a single question: keep the config as it stands, or
change it.

| What you found | What to do |
| -------------- | ---------- |
| Detection agrees with the file | Say so and stop. A re-run that changes nothing is the expected outcome |
| Detection found drift - a renamed script, a doc that no longer exists, a new diagram folder | List each difference as `current -> found` and ask which to keep, per field |
| The owner wants a tier, the diagram decision or a pull-request convention changed | Re-ask **only** those questions, carrying the current value as the first option, labelled `(current)` |

Preserve every field you were not asked to change, including any the owner hand
edited after the last run. Write the file only once the answers are in.

## 1. Detect, do not assume

| Field             | How to fill it                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectsDir`     | An existing plan folder if the repo has one (`docs/projects`, `.planning`, or wherever plans already live); otherwise `docs/projects`                                                                                   |
| `gates`           | Read `package.json` scripts, or the `Makefile`, `justfile`, `Cargo.toml`, `pyproject.toml`. Map lint / types / unit / e2e to the **script names that exist**. Omit a gate the repo has no script for - never invent one |
| `e2eTriggerPaths` | The paths whose changes need the slow suite. Ask if it is not obvious                                                                                                                                                   |
| `docsChecklist`   | One row per doc that must stay true, each with what it owns. Read the repo's docs before writing rows                                                                                                                   |
| `decisions`       | Where the repo keeps decision records and its glossary, if it keeps either. **Detect, do not create - see below**                                                                                                       |
| `diagrams`        | **Not yours to decide. Ask - step 3.** Find the candidates first, excluding copies: see the command below                                                                                                               |
| `pullRequests`    | The conventions - prefixes, labels, assignee, stack, parallel runs - are **asked in step 4**, from what the history shows. `maxLines` 400 unless the owner names another budget. `excludeFromCount`: the repo's real test globs (read the test runner's config), its lockfile, and any snapshot or generated folder - tests are excluded so the budget measures the code a reviewer reasons about |
| `commitTypes`     | Conventional-commit types the repo already uses - check `git log --format=%s -n 40`                                                                                                                                     |
| `models`          | **Not detectable. Ask - step 2.**                                                                                                                                                                                       |

Find diagram candidates with `git ls-files`, not `find` - it already excludes
build output, dependencies and the untracked worktree copies that otherwise
triple the count:

```bash
git ls-files '*.excalidraw' '*.drawio' '*.mmd' '*.d2' '*.puml'
```

### `decisions` - detect only

`decisions.adrDir` is where a hard decision goes when it is worth keeping past
the plan folder, and `decisions.glossary` is the doc whose vocabulary the plan
should use. Both are pointers to places the repo **already has**:

```bash
git ls-files | grep -iE '(^|/)(adr|decisions)/|(^|/)(CONTEXT|GLOSSARY)\.md$'
```

Record what you find and omit what you do not. Creating an ADR folder for a repo
that does not keep one is a practice decision, and it belongs to the owner - say
in your report that the key is unset and what that costs: a hard decision made
during a plan lives only in the gitignored plan folder and is lost with it.

## 2. Ask which model takes each tier

Every task in a plan declares a difficulty tier, and the tier binds the runner:
whoever takes the task switches to that model first. So the mapping has to be the
repo owner's decision, not yours - it is their cost and latency budget.

**Ask before writing the config.** One `AskUserQuestion` call carries all four
questions - these three plus step 3's - so the owner answers once. Put the
recommended option first and label it `(Recommended)`. On a re-run (step 0), ask
only the questions being changed, and make the current value the first option
labelled `(current)`.

| Tier              | What lands here                                                                                                                        | Recommend | Also offer        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------- |
| 🧠 **deep**       | Crosses module boundaries; touches the subsystem where a mistake is expensive. Plans, sequencing, PR splits and findings also run here | `opus`    | `fable`, `sonnet` |
| ⚙️ **surface**    | One layer, one view, one service, one spec. The bulk of a plan                                                                         | `sonnet`  | `opus`, `haiku`   |
| 🔧 **mechanical** | Proven by the gates alone: rename, copy fix, version bump, dependency bump                                                             | `haiku`   | `sonnet`, a Codex model |

Say what each choice costs in the option description, so the answer is informed:

- **deep → `opus`** - the default. Reach for `sonnet` here only in a small or
  low-risk repo where nothing crosses module boundaries.
- **surface → `sonnet`** - moving this to `opus` is the common upgrade for a repo
  with strict standards; moving it to `haiku` reliably produces work that fails
  the standards review.
- **mechanical → `haiku`** - safe precisely because the gates, not the model,
  decide whether the task is done. If the repo has no unit suite, there are no
  gates to lean on: recommend `sonnet` instead and say why. Offer a Codex model,
  such as `gpt-6-luna`, only when the Codex plugin is installed: the tier then
  runs through `codex:codex-rescue`, `gate-runner` included.

The 🙋 **human** tier is fixed and takes no model - a merge, a login, a
credential. It exists so those steps are tracked rather than assumed.

The mapping drives this plugin's agents too, not just task rows: `plan-architect`
and `standards-reviewer` run on `deep`, `docs-diagram-auditor` on `surface`,
`gate-runner` on `mechanical`. So an answer here is a standing cost decision, not
a per-task one.

Four questions is the cap on one `AskUserQuestion` call, and the three tiers plus
step 3 fill it. So one thing you cannot infer needs a **second, separate ask**:
**which subsystem makes a task deep in this repo.** Propose the answer from what
you read (the module with the most cross-cutting state, the one the tests mock
everywhere) and let the owner correct it - a plain question in your reply is
enough, it does not need its own tool call. It goes into the CLAUDE.md section as
the 🧠 row's scope.

If the owner dismisses either ask, take the recommended options, say in your
report that you did, and name the file to edit. Do not stall the setup on it.

## 3. Ask whether this repo keeps diagrams

A diagram is a real maintenance cost, and a repo that will not pay it is better
off with none than with a stale one. So the owner decides - not you, and not the
mere presence of a file.

Ask, recommending by what you found in step 1:

| Answer | Recommend it when | Config |
| ------ | ----------------- | ------ |
| **Maintain them** | Diagram files already exist and look current | `{ "maintain": true, "glob": "...", "format": "...", "editedBy": "..." }` |
| **Adopt them** | No diagram files, but the owner wants the practice from now on. Agree the folder and format before writing the glob | same, with the agreed glob |
| **None** | No diagram files, or the ones you found are stale and unloved | `{ "maintain": false }` |

When they are kept, two more values follow from the format rather than from
another question - state which you inferred:

- `format`: `excalidraw`, `drawio`, `mermaid`, `d2`, `plantuml`.
- `editedBy`: `human` for canvas formats (excalidraw, drawio) - an agent can read
  labels but a text edit changes no layout, so it overflows the box. `agent` for
  text formats (mermaid, d2, plantuml), which diff and render like source.

If they choose **None**, say plainly what turns off: `docs-sync` skips its diagram
section, and the `docs-diagram-auditor` agent checks prose only.

## 4. Ask the pull-request conventions

Every pull request this workflow opens carries a branch name, a title, labels
and an assignee, and a repo that already has a house style rejects one that
ignores it. Those conventions are the owner's, so ask - but read the history
first, so each question carries the answer the repo already gives:

```bash
gh pr list --state merged -L 30 --json title,headRefName,labels,assignees
gh label list -L 100 --json name
git branch -r --format='%(refname:short)' | head -40
```

Without `gh` or a GitHub remote, read the branch names alone and say the rest
went undetected.

Then look for a stacking tool. A stack is a chain of pull requests, each based
on the one below it, that the tool rebases and submits together:

| Tool | Detected by | Opens a branch on the stack | Submits |
| ---- | ----------- | --------------------------- | ------- |
| Graphite | `gt` on `PATH` and `.git/.graphite_repo_config` | `gt create <branch> -m "<message>"` | `gt submit --stack --draft` |
| git-town | `git config --get-regexp '^git-town\.'` prints a line | `git town append <branch>` | `git town propose` |

Another stacking tool in use - `spr`, `ghstack`, Sapling - is recorded by name
with the commands the owner gives you. A tool installed but never configured
for this repo is not in use.

**A second `AskUserQuestion` call** carries the first four questions, and a
third carries what follows from them - the cap is four per call. Recommend what
the history shows; when it shows nothing, recommend the plain option.

| # | Question | Options | Config |
| - | -------- | ------- | ------ |
| 1 | Does a branch name carry a prefix? | None - `<type>/<slug>` · the prefix the history shows, such as `gm/` or `{ticket}/` · Other | `branchPrefix` |
| 2 | Does a pull-request title carry a prefix? | None - the conventional title as is · the prefix the history shows, such as `[{ticket}] ` · Other | `titlePrefix` |
| 3 | Which labels does a pull request get? | By commit type, mapped to the labels that exist (`fix` → `bug`) · one fixed set on every pull request · None | `labels.byType`, `labels.always` |
| 4 | Is the owner assigned to every pull request? | Yes - `--assignee @me` · No | `assignOwner` |

The third call:

| # | Asked when | Question | Options | Config |
| - | ---------- | -------- | ------- | ------ |
| 5 | Question 3 chose labels | A label is not in the repo when a pull request opens. Create it, or ask which existing one to use instead? | Ask (Recommended) - a label created by an agent is noise every other pull request inherits · Create | `labels.onMissing`: `ask`, `create` |
| 6 | A stacking tool was detected | Is the stack the standard? | Stack the pull requests that depend on each other (Recommended) · stack every pull request in a plan, one chain · Do not use the stack - plain branches with a base | `stack`: `{ "tool": "graphite", "scope": "dependent" }`, `"scope": "all"`, or `null` |
| 7 | Always | When a plan has pull requests that do not depend on each other - outside any stack - may their tasks run in parallel subagents? | No (Recommended) - one task at a time, the owner's attention on one diff · Yes - one subagent per pull request, each in its own worktree | `parallel`: `false`, `true` |

`{ticket}` in a prefix is a placeholder: the plan records each pull request's
ticket, and a pull request without one gets a question at its first task. A
prefix that is the same on every pull request is written literally.

Say what the parallel answer costs in its option. The subagents' work runs at
once, but every checkpoint the owner holds - the tests, the grill, the diff, the
commit - stays in the main session, one pull request at a time. It saves wall
time on the writing and the gates, not attention.

On a re-run, ask only the conventions being changed, the current value first
and labelled `(current)`. If the owner dismisses an ask, take the recommended
options and say so in the report.

## 5. Write `.claude/workflow.json`

`examples/workflow.example.json` is the shape. Every value in it is a
placeholder - replace all of them with what steps 1 to 4 found. On a re-run,
start from the file that is already there and change only the fields step 0
settled. Record the model answers as the aliases the harness accepts, or as the
Codex model id when a tier runs on Codex:

```json
"models": { "deep": "opus", "surface": "sonnet", "mechanical": "haiku" }
```

Write `"aiSignature": false` unless the owner asked for AI attribution in
commits. It is the switch for every `Co-Authored-By` trailer and "Generated
with" line the workflow writes, and a missing key means `false`.

Gitignore the per-project plan folders. Plans are working documents: committing
them invites code and commit messages to cite them, and a citation to a
gitignored file points at nothing.

The negation is per file, not per folder, so **list every committed file that
lives under `projectsDir`** - the templates, and any flow or convention doc kept
there. Check with `git ls-files <projectsDir>` before writing the rule, and
verify it after with `git check-ignore -v <a committed doc>`, which must print
nothing.

```
<projectsDir>/
!<projectsDir>/examples/
!<projectsDir>/examples/SCOPE.md
!<projectsDir>/examples/TASKS.md
!<projectsDir>/examples/QUESTIONS.md
!<projectsDir>/examples/PROGRESS.md
!<projectsDir>/<any other committed doc>
```

Skip the whole step when `projectsDir` is already ignored - re-running this skill
must not append a second copy of the rule.

## 6. Put the workflow section in CLAUDE.md

**Read CLAUDE.md first.** A repo that already describes a workflow gets
reconciled, not appended to - a second, subtly different account of the cycle is
worse than none, because a reader has no way to tell which one binds.

| What you find | What to do |
| ------------- | ---------- |
| No workflow section | Append `templates/CLAUDE-workflow-section.md`, filled in |
| A workflow section that matches the plugin | Leave it. Add only what is missing - typically the tier table and the `.claude/workflow.json` pointer |
| A workflow section that contradicts the plugin | Change nothing. Report each conflict as a question: which one is meant to bind. The repo's own text wins until the owner says otherwise |
| The workflow lives in its own doc | Do not copy it into CLAUDE.md. Point at that doc, and say so in your report |

Fill in the detected commands, the answers from steps 2 and 3, and the docs the
repo actually has. Drop the diagram line when diagrams are off. Do not restate
the plugin's skill bodies - CLAUDE.md carries the repo's rules, the plugin
carries the procedure.

## 7. Enforce what prose cannot

A prose invariant rots the first time someone edits without reading it.

- **Dependency direction** - if the repo has directional layers, add the lint rule
  that fails the import (`no-restricted-imports` or the equivalent), rather than a
  paragraph asking for it.
- **Commit and command discipline** - the plugin's hooks stop and ask the owner
  before `--no-verify`, `git add -A`, bare `npx`-style invocations of the gate
  binaries, branch deletes/renames, force pushes and any other git force flag.
  A git force flag is refused outright unless the call's description says why
  force is needed. Confirm they are active with `/hooks`.

Report the tier mapping, the diagram decision and the pull-request conventions that were chosen, which gates
were detected, which were missing, and what you gitignored.
