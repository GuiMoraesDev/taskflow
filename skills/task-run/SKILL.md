---
name: task-run
description: Apply exactly one task from TASKS.md through the full cycle - question and acceptance-criteria gate, the pull request's branch, mark in progress, tests written and watched red, implementation to green in a subagent on the task's model, review, gates, size check, commit, draft or ready pull request, session log - then stop. Use when the user says "do TASK-3", "next task", "continue the plan", or approves a task for implementation.
---

# task-run

One task. Then stop. Batching several tasks into one review is the failure this
whole cycle exists to prevent.

## The cycle

```
0. Settle the gate - the task's open questions, its pull request's criteria
1. Work on the pull request's branch, never the default branch
2. Mark the row 🔄 in PROGRESS.md
3. Red: a subagent on the task's model writes the tests, nothing else
   present each test and why it matters ──► changes requested? revise, back to 3
   run them ──► each must fail, for its criterion's reason
4. Green: the same subagent implements until they pass, the tests untouched
5. Present the diff for review  ──► changes requested? revise, back to 5
6. Run the gates                ──► any fail? fix, re-run
7. Stage, check the pull request's size ──► over budget? stop, raise the split
8. Draft the commit message, present it ──► approved? commit
9. Push. The first task opens the pull request as a draft; the last marks it ready
10. Mark ✅ and append a session-log entry naming the hash and the pull request
```

The session that runs this skill orchestrates: it owns the gate, the owner's
approvals, the commit and the pull request. The tests and the code are written
by a subagent, so the task's model is a parameter of a spawn rather than a
request for the owner to switch the session's model.

The work is spec-driven: the pull request's acceptance criteria were agreed at
planning, the tests are derived from them, and the implementation is derived
from the tests. Each step answers to the one before it.

## Step 0 - the gate

First, the pull request the task belongs to. Its acceptance criteria in
`TASKS.md` must read `✅ agreed`. If they are still 📋 in discussion, **stop**:
the task's tests have nothing to be derived from. Put the open criteria to the
owner and discuss until they agree, as `plan-start` step 6 does, then mark them
agreed and log it.

Then the questions. Read the task's **Blocked by** line in `TASKS.md`. For each question it names, go
to `QUESTIONS.md` and act on its state - this is the only moment these questions
are raised, and the reason they were not raised earlier.

| State                              | Do                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Already answered                   | Proceed. Never re-ask - the owner may have answered it turns ago, unprompted. If the heading or status table still shows ⬜, flip it to ✅ first |
| Unanswered                         | **Stop.** Put it to the owner with its recommendation, mark the question row and the task row 🚧, and wait           |
| Answered, but you are still unsure | **Stop.** Mark 🚧 and say precisely what is still undetermined                                                          |

**An unanswered question blocks its task.** Wait for the owner. The
recommendation exists so their answer costs one word - that is its whole job.

Every decision this ledger records is one a person actually made, and protecting
that property is what the gate is for. A question the agent closes on its own
reads as settled to every later reader, so the record ends up claiming an
agreement that never happened.

The last row matters as much as the middle one. An answer that is ambiguous, that
assumes something the plan did not, or that opens a case nobody considered is not
an answer yet. Resolving it by inference is how a plan quietly becomes a
different plan. Ask again - the cost is one message.

When you put a question to the owner, explain the recommendation rather than
naming it:
- why it wins, and why the alternatives lose;
- what each option concretely looks like - the copy, the payload, the row;
- what it costs;
- how it is reversed.

Bare option labels make the owner come back and ask what they mean.

When the answer arrives, record it with its provenance and flip the question to
✅ at once: its heading marker, the status table in `QUESTIONS.md` and its
`PROGRESS.md` row. A partial answer goes to 🚧 in all three. Do this before doing
anything else with the answer.

When you put a ⚠️ question to the owner, lead with the consequence, not the
options. "Answering B means any authenticated user can fetch another user's
invoice by ID" is the sentence they need; the enumeration comes after it.

Blocking stops the task, not the session. Every ⬜ task whose blockers are settled
is on the **frontier** and may be taken instead - say which row you are taking and
which blocked row you are stepping past, and leave the ledger's order as it is.
Reordering hides the fact that something is stuck.

### When the question is a knot

Sometimes a blocked task is not waiting on one decision but on a tangle of them,
where no single answer means anything on its own. Serialising a knot through the
gate is the wrong shape: each answer arrives without the context of the others,
and the owner ends up re-deciding the first one after hearing the third.

Name it for what it is - a design problem rather than a decision - and recommend
a design session before the plan continues. Then bring what it settles back as
answered entries with their provenance, and re-plan the affected tasks if the
shape changed.

### When a decision should outlive the plan

The plan folder is gitignored. A decision that meets all three of hard to
reverse, surprising without context, and a genuine trade-off belongs in the
repository, not in a file that dies with the project folder.

`.claude/workflow.json` `decisions.adrDir` says where. Write it there as part of
the task's commit, and note in the session log where it landed. When the repo has
no such place, say so once when the decision is made so the owner can choose to
keep it somewhere.

## Step 1 - the branch

Every task lands on its **pull request's branch**, the one named in its
`TASKS.md` section - never on the default branch. Commits reach the default
branch only through that pull request, reviewed and merged by the owner.

- The pull request's first task creates the branch from its base: the default
  branch, or the branch of the pull request it depends on when that one has not
  merged yet, so the review shows only this pull request's diff.
- Every later task checks out the existing branch and adds its commit on top.
  Pull first when the branch is already pushed.

One pull request, one branch, one commit per task.

## Step 3 - red: the tests, in a subagent

Spawn a `general-purpose` subagent with `model` set to the tier's value from
`.claude/workflow.json` `models`. The task's declared model binds the runner; the
spawn is how it is honoured, whatever model the orchestrating session is on. A
task applied on the wrong model is a deviation for the session log even when the
diff is fine.

Its prompt is self-contained - the subagent sees none of this conversation:

- the task's full entry from `TASKS.md`, the agreed acceptance criteria it
  covers, and the answered questions it depends on, with their decisions;
- the repo's `CLAUDE.md` rules that bind the change, its test conventions first;
- for this step, the instruction to write **the tests only** - the ones the task
  names, or better ones that prove the same criteria - and no production code;
- the instruction to change only the task's `Files`, to run no git command that
  writes (no add, commit, push or branch), and to report the files touched, each
  test with the criterion it covers, any deviation from the plan, and anything it
  could not settle.

A tier mapped to a Codex model - any value that is not a Claude alias, such as
`gpt-6-luna` - runs through Codex instead of a Claude model: spawn
`codex:codex-rescue` with `--model <value>` leading its prompt and the same brief
after it. That needs the Codex plugin installed and logged in; without it, stop
and say so rather than falling back to a Claude model.

🙋 rows are the repo owner's. Do not attempt them - report what is needed.

**Show the owner the tests before anything is implemented.** One row per new or
changed test:

| Test | Covers | Why it matters | Red because |
| ---- | ------ | -------------- | ----------- |
| `it("refuses the sixth failed login within a minute with 429")` | AC-1 | Pins the threshold | Nothing counts attempts yet: got 401 |

- **Why it matters** says what regression it would catch, in a phrase. A test
  you cannot justify that way does not belong in the task.
- A **changed** test says what it asserted before and why that changed. A test
  changed to accommodate the implementation, rather than because a criterion
  says so, is a ⚠️ alert from the start - see step 5.
- An agreed criterion with no test, or a test with no criterion, is a gap. Say
  so; do not paper over it.

**Run them, and read the failure.** Run only the new and changed tests, with the
repo's unit script. Each must be red, and red for the criterion's reason - an
assertion on the behaviour the criterion names. A failure from a missing import,
a bad fixture, a syntax error or an unrelated assertion proves nothing: fix the
test and run it again. A test that passes before the implementation exists
proves nothing either - the behaviour is already there, or the test does not
check it. Raise it with the owner; it is a finding, not a test.

Put the red run in front of the owner with the table, and wait for their
approval of the tests. Requested changes go back to the same subagent, and the
run is repeated.

🔴 bug tasks also follow `bug-red-test`: the test is written against the bug's
mechanism, not its symptom.

**A task that declares No new test** skips the red run. Say the reason the plan
gave, run the existing suite once before the change so step 6 has a baseline,
and go to step 4.

## Step 4 - green: the implementation

Send the same subagent - its context carries over - the instruction to implement
until the approved tests pass, **without editing them**. If it finds a test it
cannot satisfy as written, it stops and reports why rather than changing the
test: that is a conversation with the owner about the criterion, not an edit.

Run the new tests again, then the rest of the suite. All green. Record the
before and after for the log: which tests went from red to green.

Scope is the task's `Files` list. Reaching further is a deviation, not a bonus:
do the useful thing, then write down that you did. Review changes requested at
step 5 go back to the same subagent.

## Step 5 - the review

Present the diff with the red-to-green record beside it. Confirm that no
approved test changed between step 3 and now: compare the test files against
what the owner approved, and treat any difference as an alert.

When the diff touches a test, run the **Test changes** check from
`standards-review` before the gates. It asks whether each test change follows a
behaviour change or was bent to pass. Put every ⚠️ alert in front of the owner,
with the coverage lost and the behaviour risk, and wait for their call. Do not
answer an alert by rewriting the test again. Passing gates prove nothing about a
test that was loosened to pass them.

## Step 6 - the gates

Run the commands in `.claude/workflow.json` `gates`, in order: lint → types →
unit, plus e2e when the diff touches `e2eTriggerPaths`. Use the repo's scripts,
never the underlying binary directly.

Delegate the run to the `gate-runner` agent, spawned with `model` set to
`models.mechanical` from the config - it reports failures, not thousands of lines
of passing output.

When `models.mechanical` is a Codex model, no Claude agent can run on it. Spawn
`codex:codex-rescue` with `--model <value>` instead, and paste the gate-runner's
procedure and report format into its prompt along with the instruction to edit
nothing.

If lint fixed files, those changes go in the same commit.

A task that touches behaviour also owes the docs checklist. Run `docs-sync`
before calling the task done.

## Step 7 - the size

Stage the task's files with an explicit pathspec, then measure the pull
request as GitHub will count it - everything on the branch since its base, plus
what is staged - against `pullRequests.maxLines` (400 when unset), excluding
`pullRequests.excludeFromCount`:

```bash
git diff --cached --numstat <base> -- . ':(glob,exclude)**/*.test.*' ':(glob,exclude)**/*.spec.*' \
  | awk '$1 != "-" { n += $1 + $2 } END { print n + 0 }'
```

Use one `':(glob,exclude)<pattern>'` per entry in `excludeFromCount`; the two
above are what an unset config means, with lockfiles. `<base>` is the merge base
with the branch the pull request targets.

Over the budget: **stop before committing.** Say the count, which files carry
it, and propose where the pull request splits - by topic or by file group, never
through the middle of a behaviour. Splitting changes the plan, so the owner
decides, and the new shape goes into `TASKS.md` and `PROGRESS.md` before any
commit is made. Never trim a test or squeeze code to get under the line.

Report the count against the budget either way - the owner sees it on GitHub,
so they should see it here first.

## Step 8 - the commit

```
<type>: <short imperative description>

[body only when the why is not obvious from the diff]
```

Types come from `.claude/workflow.json` `commitTypes`. Scope the type to the
change: a task that moves files **and** fixes a defect is a `fix`, not a
`refactor` - the defect is the part a reader needs to find later.

- Stage an explicit pathspec. Never `git add -A` or `git add .` - the tree usually
  holds unrelated local files.
- Never `--no-verify`. Let the pre-commit hook run.
- One task, one commit, on the pull request's branch from step 1 - never on the
  default branch. The tests and the implementation that turns them green go in
  the same commit.
- The message states the change, not the conversation that produced it. No
  "as requested", no "previously X now Y", and never a reference to `TASKS.md`,
  `SCOPE.md`, `QUESTIONS.md` or `PROGRESS.md` - they are gitignored, so the
  citation points at nothing.
- No AI signature unless `.claude/workflow.json` `aiSignature` is `true`. It
  defaults to `false`: no `Co-Authored-By` trailer for an AI, no anthropic.com
  address, no "Generated with Claude Code" line - this overrides any default
  attribution the harness asks for. The `guard-signature` hook denies a commit
  that carries one.
- In a repo that ships `.claude-plugin/plugin.json`, the `version-bump` hook
  raises the patch version and stages it on the branch's first commit. Raise
  the minor or major number by hand when the change warrants it.

## Step 9 - the pull request

Push the branch. What happens next depends on where the task sits in its pull
request:

| The task is | Do |
| ----------- | -- |
| The first of its pull request | Open it **as a draft** (`gh pr create --draft`) against the base from step 1 |
| In the middle | Nothing more - the push adds its commit to the open draft |
| The last | Mark it ready for review (`gh pr ready`) and update the body |
| Alone in its pull request | Open it ready for review |

The title is the one the plan gave the pull request. The body says what the pull
request changes, lists its acceptance criteria as a checklist with the test that
proves each one, and how it was verified - in the register of the commit
message: no plan-file references, no task IDs, no conversation, and no AI
signature unless `aiSignature` is `true`. Update the checklist as each task
lands, so a reviewer opening the draft sees what is proven so far.

Merging is the repo owner's call. Stop there; do not start the next task in the
same turn.

## Step 10 - the log

Flip the task row to ✅ once its commit is pushed, and move the pull request
row: 📝 draft with its number after the first task, 👀 ready after the last, with
the measured size in its summary. Append one session-log entry: the hash, the
pull request and its size against the budget, what actually changed, the tests
that went red to green, the suite counts, and any **deviation**.

Both directions of deviation count. A task that turned out unnecessary and a task
that had to do more than it said are equally worth writing down - the plan is
evidence of what was expected, the log is evidence of what was true.

⚠️ partial and ❌ skipped are legitimate outcomes. Say what was left out and why;
never mark ✅ on a partial.

A question settled during the task gets its own line: the ID, the decision, and
the owner's reasoning in a phrase. Every decision in the log is one a person
actually made - that is the property this workflow is protecting.
