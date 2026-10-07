---
name: task-run
description: Apply exactly one task from TASKS.md through the full cycle - question gate, task branch, mark in progress, change in a subagent on the task's model, review, gates, commit, pull request, session log - then stop. Use when the user says "do TASK-3", "next task", "continue the plan", or approves a task for implementation.
---

# task-run

One task. Then stop. Batching several tasks into one review is the failure this
whole cycle exists to prevent.

## The cycle

```
0. Settle the task's open questions            ← the gate, before anything else
1. Put the work on a task branch, never the default branch
2. Mark the row 🔄 in PROGRESS.md
3. Hand the change to a subagent on the task's model   ← not optional
4. Present the diff for review  ──► changes requested? revise, back to 4
5. Run the gates                ──► any fail? fix, re-run
6. Draft the commit message, present it ──► approved? commit
7. Push the branch and open a pull request for review
8. Mark ✅ and append a session-log entry naming the hash and the PR
```

The session that runs this skill orchestrates: it owns the question gate, the
owner's approvals, the commit and the pull request. The code change itself is
made by a subagent, so the task's model is a parameter of a spawn rather than a
request for the owner to switch the session's model.

## Step 0 - the questions

Read the task's **Blocked by** line in `TASKS.md`. For each question it names, go
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

Task commits never land on the default branch; every one reaches it through a
reviewed pull request. If the checkout is on the default branch, create a task
branch from it before anything is changed - `<commit-type>/<task-slug>`, e.g.
`feat/transactions-table-width`. One task, one branch, one pull request.

When the task builds on an earlier task whose pull request has not merged yet,
branch from that task's branch instead and open the pull request against it, so
the review shows only this task's diff.

## Step 3 - the change, in a subagent

Spawn a `general-purpose` subagent with `model` set to the tier's value from
`.claude/workflow.json` `models`. The task's declared model binds the runner; the
spawn is how it is honoured, whatever model the orchestrating session is on. A
task applied on the wrong model is a deviation for the session log even when the
diff is fine.

Its prompt is self-contained - the subagent sees none of this conversation:

- the task's full entry from `TASKS.md` and the answered questions it depends on,
  with their decisions;
- the repo's `CLAUDE.md` rules that bind the change;
- the instruction to change only the task's `Files`, to run no git command that
  writes (no add, commit, push or branch), and to report the files touched, what
  changed, any deviation from the plan, and anything it could not settle.

A tier mapped to a Codex model - any value that is not a Claude alias, such as
`gpt-6-luna` - runs through Codex instead of a Claude model: spawn
`codex:codex-rescue` with `--model <value>` leading its prompt and the same brief
after it. That needs the Codex plugin installed and logged in; without it, stop
and say so rather than falling back to a Claude model.

🙋 rows are the repo owner's. Do not attempt them - report what is needed.

Scope is the task's `Files` list. Reaching further is a deviation, not a bonus:
do the useful thing, then write down that you did. Review changes requested at
step 4 go back to the same subagent, so its context carries over.

🔴 bug tasks route through the `bug-red-test` skill before the gates. A bug fix
without a test verified failing against the old behaviour is not done.

## Step 4 - the review

When the diff touches a test, run the **Test changes** check from
`standards-review` before the gates. It asks whether each test change follows a
behaviour change or was bent to pass. Put every ⚠️ alert in front of the owner,
with the coverage lost and the behaviour risk, and wait for their call. Do not
answer an alert by rewriting the test again. Passing gates prove nothing about a
test that was loosened to pass them.

## Step 5 - the gates

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

## Step 6 - the commit

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
- Commit to the task branch from step 1, never to the default branch.
- The message states the change, not the conversation that produced it. No
  "as requested", no "previously X now Y", and never a reference to `TASKS.md`,
  `SCOPE.md`, `QUESTIONS.md` or `PROGRESS.md` - they are gitignored, so the
  citation points at nothing.

## Step 7 - the pull request

Push the task branch and open a pull request against the default branch - or
against the earlier task's branch, per step 1. Its title is the commit subject;
its body says what changed and how it was verified, in the register of the commit
message: no plan-file references, no conversation. Merging is the repo owner's
call. Stop there; do not start the next task in the same turn.

## Step 8 - the log

Flip the row to ✅ once the pull request is open, and append one session-log
entry: the hash, the pull request, what actually changed, the suite counts, and
any **deviation**.

Both directions of deviation count. A task that turned out unnecessary and a task
that had to do more than it said are equally worth writing down - the plan is
evidence of what was expected, the log is evidence of what was true.

⚠️ partial and ❌ skipped are legitimate outcomes. Say what was left out and why;
never mark ✅ on a partial.

A question settled during the task gets its own line: the ID, the decision, and
the owner's reasoning in a phrase. Every decision in the log is one a person
actually made - that is the property this workflow is protecting.
