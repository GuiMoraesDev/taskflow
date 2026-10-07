# Task details — <Short Title>

Scope lives in `SCOPE.md`. Open questions live in `QUESTIONS.md`. Status lives in
`PROGRESS.md`. This file is the detail of the work itself and nothing else.

The work is split into **pull requests**, and each pull request into **tasks**.

- A **pull request** is what the owner reviews on GitHub: one topic, one branch,
  at most `pullRequests.maxLines` changed lines (400 unless `workflow.json` says
  otherwise) not counting tests and generated files. Its section says what the
  owner will see there - the title, the branch, the commits in order, the files,
  and the acceptance criteria it proves.
- A **task** is one commit on that branch, applied on its own and reviewed before
  the next, and declares a category and the model that must take it. The change
  is made by a subagent spawned on that model.

Category: 🔴 bug · 🟡 refactor · 🟢 chore · 🔍 investigation
Model: 🧠 deep · ⚙️ single-surface · 🔧 mechanical · 🙋 human

A task that names an open question in **Blocked by** does not start until that
question is answered in `QUESTIONS.md`. No task starts while its pull request's
acceptance criteria are still 📋 in discussion.

**Cut vertically.** A task carries one behaviour through every layer it touches -
schema, service, view, test - so finishing it makes something observably true.
"Add the column" is a layer, not a task: it passes the gates and gives a reviewer
nothing to check. The test is whether you can say what is true after the commit
that was not true before it.

**Tests come first.** Every task that changes behaviour names the tests it adds
or changes, each tied to an acceptance criterion, and those tests are watched
failing before the implementation is written. A task that changes no behaviour
says **No new test** and why.

---

## PR-1 · feat: <title exactly as it will appear on GitHub>

**Branch:** `feat/<slug>` → `main` · **Size:** ~310 / 400 lines (tests excluded)
· **Tasks:** TASK-1, TASK-2 · **Depends on:** —

**What you will see on GitHub:** a draft opened by TASK-1, one commit per task
below, marked ready for review when TASK-2 lands. The diff touches
`src/auth/login.ts`, `src/auth/limiter.ts` and their tests. Review it by checking
each acceptance criterion against the test that proves it.

**Acceptance criteria:** ✅ agreed YYYY-MM-DD

- **AC-1** — Given an account with five failed logins in the last minute, when a
  sixth attempt arrives, then it is refused with 429 and the password is not
  checked.
- **AC-2** — Given an account with failed attempts, when a login succeeds, then
  the counter resets to zero.

### TASK-1 · <Task title>

**Category:** 🔴 Bug · **Model:** 🧠 Opus · **Blocked by:** — · **Covers:** AC-1

**Files:** `src/auth/limiter.ts`, `src/auth/limiter.test.ts`

What is wrong today, and what the desired behaviour is.

**Tests (red first):**

| Test | Covers | Why it matters |
| ---- | ------ | -------------- |
| `it("refuses the sixth failed login within a minute with 429")` | AC-1 | Pins the threshold; fails today because nothing counts attempts |
| `it("does not check the password once the limit is hit")` | AC-1 | Without it, a limited account still leaks timing on the password check |

**Implementation:** the approach - what to add, remove or modify. A snippet only
where the change is non-obvious.

**Verification:** the tests above, red before the implementation and green after,
with the rest of the suite still green.

---

### TASK-2 · <Task title>

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet · **Blocked by:** Q1 · **Covers:** —

**Files:** `src/path/to/another.ts`

...

**Tests:** No new test - the change moves code without changing what it does.
The existing suite stays green before and after; name any test that has to move
or be re-pointed.

---

## PR-2 · chore: <title>

**Branch:** `chore/<slug>` → `main` · **Size:** ~20 / 400 lines · **Tasks:**
TASK-3 · **Depends on:** —

**What you will see on GitHub:** ...

**Acceptance criteria:** none - this pull request changes no behaviour, and says
so here.

### TASK-3 · <Task title>

**Category:** 🟢 Chore · **Model:** 🙋 Human · **Blocked by:** — · **Covers:** —

**Files:** `<what the owner has to touch>`

A step no model can finish - a credential, a merge, a dashboard, a diagram the
repo keeps in a canvas format. It gets a row so it is tracked rather than
assumed, and stays ⬜ until the repo owner does it. Say what "done" looks like.

**Tests:** No new test - nothing in the repo changes behaviour.

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

The line budget applies here too. Group the phases into pull requests that each
stay under it - typically the expand in one, the migrate batches in as many as
the budget needs, the contract in the last.

### TASK-4 · Expand: add `<new form>` alongside `<old form>`

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet · **Blocked by:** — · **Covers:** —

**Files:** `src/path/to/definition.ts`

**Tests:** No new test - the suite stays green and no call site has moved yet.

---

### TASK-5 · Migrate `<area>` to `<new form>`

**Category:** 🟡 Refactor · **Model:** 🔧 Haiku · **Blocked by:** TASK-4 · **Covers:** —

**Files:** `src/<area>/**`

One batch. Name the boundary in the title so the batches read as a set, and give
each its own row.

**Tests:** No new test - the suite stays green with this batch migrated and the
rest still on the old form.

---

### TASK-6 · Contract: remove `<old form>`

**Category:** 🟡 Refactor · **Model:** ⚙️ Sonnet · **Blocked by:** TASK-5, and
every other migrate task · **Covers:** —

**Files:** `src/path/to/definition.ts`

**Tests:** No new test - the old form has no callers left (say how you checked),
and the suite stays green.
