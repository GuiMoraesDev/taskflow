---
name: plan-start
description: Scaffold PLAN.md and PROGRESS.md for a new piece of work before any code is touched - scope, one task per commit, each task carrying a category and the model that must take it. Use when starting a feature, refactor or bug batch, or when the user says "plan this", "start a project", or names a project folder that does not exist yet.
---

# plan-start

No code is touched until these two files exist.

## 1. Read the config

`.claude/workflow.json` gives `projectsDir` and the tier-to-model mapping. If it is missing, run `init-workflow` first - do not guess a mapping, it is the repo owner's call.

Target: `<projectsDir>/<project-name>/PLAN.md` and `PROGRESS.md`. Kebab-case the project name from the user's words. If the folder already exists, read it and continue that plan instead of overwriting it.

## 2. Understand before planning

Read the code the work touches. A plan written from the request alone produces tasks that turn out wrong on contact.

For anything spanning more than two files, delegate the survey to the `plan-architect` agent and write the plan from what it reports. Spawn it with `model` set to `models.deep` from the config - the agent's own frontmatter is only the fallback when no config exists.

## 3. Write PLAN.md

Copy `templates/PLAN.md` and fill it in.

**Scope is the part that earns its keep.** Name the areas the plan may change, and the tempting ones it may not. State the escape hatch explicitly: if a task turns out to require an out-of-scope change, stop and raise it rather than widening the plan.

**One task is one commit.** If a task cannot be described as a single commit message, it is two tasks. Each declares:

| Field        | Rule                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category     | 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation (produces a finding, not a commit)                                                                                     |
| Model        | The tier - 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human-only - written with the model `workflow.json` maps it to, so the row tells the runner what to switch to |
| Files        | The real paths. A task with no file list is not planned yet                                                                                                               |
| Verification | For 🔴, name the test to add and the behaviour it must fail against. For 🟡, name any test that has to move                                                               |

Order tasks so each leaves the tree green. A task whose only justification is "we will need it later" is not a task.

## 4. Write PROGRESS.md

Copy `templates/PROGRESS.md`. One row per task, every row ⬜. Carry the plan's open questions into the table - they get answered there, not in chat.

## 5. Hand back

Report the task list as a table with categories and models, name the first task and the model it needs, and stop. Do not start it in the same turn.
