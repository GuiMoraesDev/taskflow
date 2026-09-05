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
