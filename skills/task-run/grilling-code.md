# Grilling the code

The plan was grilled at `plan-start`. This is the second grill, over the code a
task actually produces, and it exists for one reason: the owner must not lose
touch with code they did not write. A green suite proves the code does what the
tests say. Only the owner can say whether that is what the domain needs, and
only if they understand what the code does.

The orchestrating session runs it. The subagent that writes the code cannot talk
to the owner, so it flags what needs grilling and the session asks.

## What gets grilled

Any test or code that carries:

- domain business logic, branching conditions (`if` / `switch`), or state
  transitions;
- domain validation rules, error boundaries, or edge cases;
- data mappings, external service contracts, or persistence mutations.

Everything else - plumbing, renames, formatting, syntax - goes through the
ordinary review. Grilling it spends the owner's attention on what does not need
it.

## Where it runs

| Checkpoint | Grills over | Settles |
| ---------- | ----------- | ------- |
| `task-run` step 3, before the tests are approved | The tests: what each one claims the domain does, and the cases none of them covers | That the tests pin the intended behaviour, edge cases included |
| `task-run` step 5, before the diff is approved | The critical-logic sites the subagent flagged, and any you find it missed | That the owner's model of what the code does matches what it does |

Never mid-implementation. The task is the unit of review, so its checkpoints are
the grill's checkpoints.

## The loop

Ask **concise, high-impact questions** about intent, edge cases and domain
invariants - never trivial syntax. Anchor each in what was written:

> I added a retry with a fallback status when the payment fails. Is that the
> failure state your domain expects, or should it abort immediately?

Work it in rounds, like the plan grill: number the questions, give your
recommended answer with each, and ask every question whose prerequisites are
settled in the same round. Follow up on any branch the answers leave ambiguous,
until the understanding is shared completely.

**Do not let the owner hand-wave.** An answer that leaves an edge case unhandled
gets challenged on that edge case, by name. "It's fine" about a branch nobody
has described is not an answer.

**Invert the review.** Do not expect the owner to read every line. Use the
questions to check their mental model of what the code does: ask them what
happens in a case, and compare it to what the code does. A mismatch is the
finding - either the code is wrong, or their model is, and the owner decides
which.

**Never inject a business rule silently.** Any rule the subagent chose on its
own - a default, a threshold, a fallback, an ordering - is put to the owner as a
question, not presented as a fact.

An answer that changes behaviour sends the task back: to step 3 if a test must
change, to step 4 if only the code must. An answer that changes an agreed
acceptance criterion is bigger than this task - stop and raise it.

## The output

Once a checkpoint's questions are settled, write the **agreed behaviour**: a
bulleted summary, in domain terms, of what the code does - the rules, the edge
cases and how each is handled, the invariants it keeps.

- One block per task, recorded in its session-log entry.
- Accumulated in the pull request's body under **Agreed behaviour**, so the
  reviewer reads what the owner agreed the code does next to the code itself.
- When the pull request's last task lands, the block is consolidated into its
  **source of truth**: the system's behaviour as this pull request leaves it,
  one list, no duplicates.
