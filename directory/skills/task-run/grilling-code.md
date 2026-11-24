# Critical logic

A green suite proves the code does what the tests say. Only the owner can say
whether that is what the domain needs, so the code most likely to diverge from
it is named, not left for them to find.

## What counts

Any test or code that carries:

- domain business logic, branching conditions (`if` / `switch`), or state
  transitions;
- domain validation rules, error boundaries, or edge cases;
- data mappings, external service contracts, or persistence mutations.

Everything else - plumbing, renames, formatting, syntax - goes through the
ordinary review.

## Where it is used

| Where | What |
| ----- | ---- |
| `task-run` step 0, the sitting | The test rows that pin these kinds get the questioning below |
| `task-run` step 3 | The subagent flags every site of these kinds it writes, with path and line |
| `task-run` step 9 | The flagged sites feed the inline pointers, after the reviewer's findings |

## Questioning the tests

At the sitting, ask **concise, high-impact questions** about intent, edge cases
and domain invariants - never trivial syntax. Anchor each in a test row:

> This test pins a fallback status when the payment fails. Is that the failure
> state your domain expects, or should it abort immediately?

Number the questions and give your recommended answer with each. An answer that
leaves an edge case unhandled gets challenged on that edge case, by name. Ask
the owner what happens in a case rather than telling them; a mismatch with the
test is the finding, and the owner decides which side is wrong.

A business rule the subagent chose on its own - a default, a threshold, a
fallback, an ordering - is a question, never a fact.
