---
name: standards-review
description: Audit a diff against the standards the repo's own CLAUDE.md states - abstraction, comments, register, boundaries, naming. Use before a commit, when reviewing a branch or PR, or when the user asks whether a change follows the standards.
---

# standards-review

Correctness bugs are `/code-review`'s job. This is the other axis: does the code
read like the rest of the repo.

**The repo's `CLAUDE.md` owns the standards; this skill owns the procedure.**
Read it first. A rule it does not state is not a finding here - do not import
your own taste, and do not carry a rule over from another repo.

## Scope

`git diff <base>...HEAD` by default; the working tree when there is no base. Only
changed lines - a standard broken on an untouched line is not this review's find,
except a stale comment on a line you touched, which is always in scope to delete.

## Checks worth running

Apply the ones the repo's standards actually state, in the form they state them.

| Check                                   | What fails it                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Escape hatches from the type system** | A cast or suppression where an annotation, a guard or narrowing would do. A third-party `unknown` with no practical guard earns a typed wrapper, proposed - not a cast slipped in                                                                                                                                                             |
| **Premature abstraction**               | A helper, component, constant or file with exactly one caller. Inline it. Being pinnable in isolation is not reuse - pin the branches through the caller that owns them. The wrapper a single caller does earn is a third-party primitive wrapped in the repo's own shape                                                                     |
| **Comment bar**                         | The default is no comment. One survives only if it records a decision the code cannot express and a competent reader would otherwise get wrong - an ordering that looks arbitrary, a guard against a race, an undocumented external constraint. Never one per enum member, object key or function step. First reach is the rename, every time |
| **Chat-narrative leak**                 | "as requested", "as we discussed", "let's", pasted prompt text; "previously X now Y", "no longer used", "an earlier rule said". Also any reference to a gitignored working doc - "see TASKS.md", "TASK-3" - in code, comments, commit messages or test names                                                                                   |
| **Dependency direction**                | An import that reaches back up the layering, or a write to state another layer owns. If lint does not already catch it, the finding names the lint rule that would                                                                                                                                                                            |
| **Immutable by default**                | A reassigned accumulator a `map`/`filter`/`reduce` expresses. Sequential async that must short-circuit uses recursion, not a mutable loop counter                                                                                                                                                                                             |
| **Derive once**                         | The same collection filtered twice, or a throwaway count recomputed from an array already in hand                                                                                                                                                                                                                                             |
| **Boundary guards**                     | Data crossing a trust boundary - persisted state, a cross-context message, an API envelope - used without a runtime guard. The guard lives beside the type and runs at the boundary that widened the value, never on a literal the compiler already knows                                                                                     |
| **User-facing copy**                    | Punctuation or wording that breaks the repo's stated convention for strings a user reads                                                                                                                                                                                                                                                      |
| **Test naming**                         | The suite names the unit; the case states the behaviour in lowercase with no "should" and no implementation detail                                                                                                                                                                                                                            |

## Test changes

This check runs whatever the repo's `CLAUDE.md` says, because a weakened test
hides a broken behaviour from every later reviewer and gate. It applies to every
changed test: a modified or removed assertion, a deleted or skipped case, an edited
fixture, a mock, a timeout, a snapshot.

For each one, decide which it is:

- **Follows a behaviour change.** The production side of the diff changes the
  behaviour this test pins. The new expectation states the newly intended
  behaviour, traceable to the task or the requirement, and pins it at least as
  tightly as before.
- **Bent to pass.** The expectation moved to match whatever the code now does,
  with no intended behaviour change behind it - or it pins less than it did.

Signs that a test was bent:

- An assertion loosened: an exact match turned partial, a value turned
  `toBeDefined` or truthy, a count turned "at least".
- An expected value swapped for the observed one, with no production change that
  explains the new value.
- A case deleted, skipped, `.only`'d or marked fixme. Fewer rows in a table-driven
  case.
- A mock widened until it swallows the call that failed. An error-path assertion
  removed.
- A timeout raised or retries added to quiet a failure. A snapshot regenerated
  wholesale.
- A fixture edited so the failing input no longer occurs.
- A title renamed so it no longer states what is checked.

For every bent change, say two things:

- **Coverage lost.** The behaviour, branch or input that is no longer pinned.
- **Behaviour risk.** Whether the production change behind it can break existing
  behaviour for a caller or a user, as a concrete scenario: "an upload with a
  refund now totals 4290 cents too high". If no risk can be named, say so.

These findings are ⚠️ and lead the report, ahead of any standards finding. They
are an alert for the owner to decide on, never fixed silently by rewriting the
test again. A test change that follows a behaviour change gets one line saying
which change justifies it.

## Reporting

Findings ranked most-severe first, each with the file, the line, and the concrete
consequence. Any test-change alert comes first. Say plainly when nothing failed - a
clean diff is a result, not a reason to invent a nit.

For a broad diff, delegate to the `standards-reviewer` agent - spawned with
`model` set to `models.deep` from `.claude/workflow.json` - and relay what it
found.
