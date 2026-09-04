# Workflow section for CLAUDE.md

Paste into the target repo's `CLAUDE.md`, replacing the bracketed values.

---

## Workflow

Before touching code, create `PLAN.md` and `PROGRESS.md` in `<PROJECTS_DIR>/<project-name>/`.
Run `/plan-start <project-name>` to scaffold them.

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
