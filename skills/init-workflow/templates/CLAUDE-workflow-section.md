# Workflow section for CLAUDE.md

Paste into the target repo's `CLAUDE.md`, replacing the bracketed values.

---

## Workflow

Before touching code, create `SCOPE.md`, `TASKS.md`, `QUESTIONS.md` and
`PROGRESS.md` in `<PROJECTS_DIR>/<project-name>/`. Run `/plan-start
<project-name>` to scaffold them.

**This cycle is authoritative for applying a task**, whatever else is installed.
Other planning or implementation workflows may be available in this environment;
a task lands through `task-run` - gates, review, one commit, session log - and a
second pipeline running beside it would give two answers to what work exists and
what is done. Borrow freely from other tools at design time; apply through this
one.

One task per commit, applied and reviewed one at a time. Every task declares the
model that must take it - switch to that model **before** starting the task.

| Symbol | Model              | Scope                                                                                                     |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------- |
| 🧠     | <DEEP_MODEL>       | Crosses module boundaries, or touches <THE_RISKY_SUBSYSTEM>. Plans, sequencing and findings also run here |
| ⚙️     | <SURFACE_MODEL>    | One layer, one surface                                                                                    |
| 🔧     | <MECHANICAL_MODEL> | Mechanical, proven by the gates alone: rename, copy fix, version bump                                     |
| 🙋     | Human              | Only the repo owner can do it: a merge, a login, a credential                                             |

The tier binds the runner, and the mapping lives in `.claude/workflow.json`. A
task applied on the wrong model is a deviation for the session log even when the
diff is fine.

Gates before every commit: `<LINT_FIX>`, `<CHECK_TYPES>`, `<TEST_UNIT>`, plus
`<TEST_E2E>` when the change touches <E2E_TRIGGER_PATHS>. The pre-commit hook
runs <HOOK_COMMANDS> and never a test, so running them is on you.

A bug fix ships a test verified failing against the old behaviour. Deviations
from the plan go in the session log.

Open questions live in `QUESTIONS.md`, each carrying a recommendation and sitting
in `PROGRESS.md` directly above the task it blocks. They are put to the repo
owner when the run reaches that task and not before, and an answer given ahead of
time is recorded with where it came from, rather than re-asked. Questions are for
decisions only: anything this repository can answer, the agent reads for itself.
An unanswered question blocks its task,
whatever its mark - the recommendation exists so the answer is cheap to give, not
so the work can proceed without it. The mark sets how the question is put: 🟦
routine goes over in a line, while ⚠️ critical - hard, unreversible, or carrying
a security consequence such as an unchecked object reference - leads with what
the wrong answer costs. An answer that leaves the next step genuinely unclear
blocks too.

## Commands

```bash
<THE_COMMAND_TABLE>
```

## Which doc owns what

| Doc               | Owns                                                            |
| ----------------- | --------------------------------------------------------------- |
| `CLAUDE.md`       | the rules: workflow, commands, test conventions, code standards |
| `README.md`       | the product: what it does, how to build and run it              |
| <ONE_ROW_PER_DOC> | <WHAT_IT_OWNS>                                                  |

<!-- Keep the next line only when .claude/workflow.json has diagrams.maintain: true -->

Docs and diagrams are verified together, never one without the other.
