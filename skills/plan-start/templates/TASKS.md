# Task details — <Short Title>

Scope lives in `SCOPE.md`. Open questions live in `QUESTIONS.md`. Status lives in
`PROGRESS.md`. This file is the detail of the work itself and nothing else.

Each task is one commit, applied on its own and reviewed before the next, and
declares a category and the model that must take it. Switch to that model before
starting the task.

Category: 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation
Model: 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human

A task that names an open question in **Blocked by** does not start until that
question is answered in `QUESTIONS.md`.

**Cut vertically.** A task carries one behaviour through every layer it touches -
schema, service, view, test - so finishing it makes something observably true.
"Add the column" is a layer, not a task: it passes the gates and gives a reviewer
nothing to check. The test is whether you can say what is true after the commit
that was not true before it.

---

### TASK-1 · <Task title>

**Category:** 🔴 Bug · **Model:** 🧠 Opus · **Blocked by:** —

**Files:** `src/path/to/file.ts`

What is wrong today, and what the desired behaviour is.

**Implementation:** the approach - what to add, remove or modify. A snippet only
where the change is non-obvious.

**Verification:** how you will know it worked. For 🔴, name the test to add and
the behaviour it must fail against.

---

### TASK-2 · <Task title>

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet · **Blocked by:** Q1

**Files:** `src/path/to/another.ts`

...

**Verification:** usually "the existing suite stays green" - say so, and name any
test that has to move or be re-pointed.

---

### TASK-3 · <Task title>

**Category:** 🟢 Chore · **Model:** 🙋 Human · **Blocked by:** —

**Files:** `<what the owner has to touch>`

A step no model can finish - a credential, a merge, a dashboard, a diagram the
repo keeps in a canvas format. It gets a row so it is tracked rather than
assumed, and stays ⬜ until the repo owner does it. Say what "done" looks like.

---

## Wide mechanical changes

Use this shape when one change - a rename, a retyped shared symbol, a moved
module - breaks call sites across the codebase at once. No vertical slice stays
green here, so the plan says so and sequences it instead of pretending.

Three phases, each phase its own task:

| Phase        | Task                                                              | Blocked by         |
| ------------ | ----------------------------------------------------------------- | ------------------ |
| **Expand**   | Add the new form beside the old. Nothing breaks; nothing migrates | —                  |
| **Migrate**  | Move call sites over in batches, each sized to stay green alone - per package, per directory, whatever the blast radius allows. One batch, one task | the expand task    |
| **Contract** | Delete the old form, once no caller remains                       | every migrate task |

Size the batches by what stays green, not by what is tidy. If even a single batch
cannot go green on its own, say so in the plan rather than shipping a red commit:
that is a scope question for the owner, not something to solve by making the
batch bigger.

### TASK-4 · Expand: add `<new form>` alongside `<old form>`

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet · **Blocked by:** —

**Files:** `src/path/to/definition.ts`

**Verification:** the suite stays green and no call site has moved yet.

---

### TASK-5 · Migrate `<area>` to `<new form>`

**Category:** 🟡 Refactor · **Model:** 🔧 Haiku · **Blocked by:** TASK-4

**Files:** `src/<area>/**`

One batch. Name the boundary in the title so the batches read as a set, and give
each its own row.

**Verification:** the suite stays green with this batch migrated and the rest
still on the old form.

---

### TASK-6 · Contract: remove `<old form>`

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet · **Blocked by:** TASK-5, and
every other migrate task

**Files:** `src/path/to/definition.ts`

**Verification:** the old form has no callers left - say how you checked - and
the suite stays green.
