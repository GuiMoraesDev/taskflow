# Plan — <Short Title>

One line: what this plan addresses and why it is needed.

---

## Scope

**In scope:** the areas this plan may change.

**Out of scope:** the areas it must not. Be specific about the tempting ones, and
state the escape hatch: _if a task turns out to require one of these, stop and
raise it rather than widening the plan._

---

## Tasks

Each task is one commit, applied on its own and reviewed before the next, and
declares a category and the model that must take it. Switch to that model before
starting the task.

Category: 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation
Model: 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human

### TASK-1 · <Task title>

**Category:** 🔴 Bug · **Model:** 🧠 Opus

**Files:** `src/path/to/file.ts`

What is wrong today, and what the desired behaviour is.

**Implementation:** the approach - what to add, remove or modify. A snippet only
where the change is non-obvious.

**Verification:** how you will know it worked. For 🔴, name the test to add and
the behaviour it must fail against.

---

### TASK-2 · <Task title>

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet

**Files:** `src/path/to/another.ts`

...

**Verification:** usually "the existing suite stays green" - say so, and name any
test that has to move or be re-pointed.

---

### TASK-3 · <Task title>

**Category:** 🟢 Chore · **Model:** 🙋 Human

**Files:** `<what the owner has to touch>`

A step no model can finish - a credential, a merge, a dashboard, a diagram the
repo keeps in a canvas format. It gets a row so it is tracked rather than
assumed, and stays ⬜ until the repo owner does it. Say what "done" looks like.

---

## Open questions

Anything the plan cannot decide on its own - naming, whether to keep a
behaviour, how far a change should reach. Carry these into `PROGRESS.md` and
answer them there before the tasks they block.
