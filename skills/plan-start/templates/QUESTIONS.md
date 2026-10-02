# Open questions — <Short Title>

Decisions the plan cannot make on its own. Each is numbered, ordered by the task
that needs it, owned by the repo owner, and answered **here** - not in a chat
message that scrolls away.

**An unanswered question blocks its task.** The run stops there and waits for the
owner. A recommendation is advice for them to accept in one word - accepting it
is their move to make, and every decision recorded below is one they actually
made.

Risk: 🟦 routine · ⚠️ critical

The mark says how hard the question is to answer and how much the answer costs -
not whether it blocks. Both block.

| Mark | Means                                                                                                                    | How it is put to the owner                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 🟦   | A preference, a name, a default. Cheap to reverse                                                                        | The question and the recommendation. Usually one line back                                        |
| ⚠️   | Hard, expensive to reverse, narrowly specific to this business, high priority, **or carrying any security consequence** | Lead with the consequence, then the options. The owner has to see what the wrong answer costs |

⚠️ is not a mood. It applies whenever the answer changes who can read or write
data, crosses a trust boundary, or touches authorization - an object reference
that is not ownership-checked (IDOR), a permission default, a token lifetime, a
field added to a public response, a rate limit, anything logged. If the wrong
answer here would be a vulnerability rather than a preference, it is ⚠️.

**Every question carries a recommendation, and the recommendation explains
itself.** A question posed without one is unfinished work handed to the owner,
and so is a bare "A, because it is simpler". The owner did not read the code,
so the recommendation has to carry what you saw. It gives:

- **Why** - the deciding reason, tied to something the owner can check: the
  code, the spec, the design, the existing behaviour. Also say why the other
  options lose, not just why this one wins.
- **What it looks like** - a concrete example: the copy the user would see, the
  payload, the row before and after. For a copy or UX choice, give **one example
  per option**, so the owner compares outcomes instead of descriptions.
- **What it costs** - what this option gives up, or what extra has to be built.
- **Reversible by** - how you would undo it, and how expensive that is.

**Only decisions live here.** If the answer is somewhere in the repository - the
code, the config, the git history, the CI workflow - go and read it rather than
asking. An unanswered question halts its task, so a question the repo could have
answered stalls the work for nothing.

## Status

Every question carries a status marker in its heading and in this table, and the
two always agree:

- ⬜ unanswered
- 🚧 partly answered - the answer is ambiguous or opened something new
- ✅ answered

The moment the owner answers, flip the question to ✅ in the same turn: the
heading, this table and its `PROGRESS.md` row together. A decision recorded in
the body while the heading still shows ⬜ reads as still open to every later
reader.

| ID | Mark | Question            | Blocks | Status                  |
| -- | ---- | ------------------- | ------ | ----------------------- |
| Q1 | 🟦   | <one-line question> | TASK-2 | ⬜ unanswered           |
| Q2 | ⚠️   | <one-line question> | TASK-5 | ⬜ unanswered           |
| Q3 | 🟦   | <one-line question> | TASK-7 | ✅ answered: **B**      |

## Provenance

Every decision records where it came from, because a choice made in a design
conversation and one made at the gate are different kinds of evidence:

- **owner, at the gate** - asked when its task came up, answered then.
- **owner, ahead of time** - settled in conversation before the question was
  reached, and harvested into this file.
- **prior decision** - already settled by an existing ADR or a previous plan.
  Record what settled it, and do not re-litigate.

---

### ⬜ Q1 · 🟦 <the question, in one line>

**Blocks:** TASK-2 · **Asked when:** before TASK-2 starts

**Why it is open:** what the plan looked at and could not settle from the code.

**Options:**

- **A —** what it means, and what it costs.
- **B —** what it means, and what it costs.

**Recommendation:** A.

- **Why:** the deciding reason, tied to what the code or the spec shows, and why
  B loses.
- **What it looks like:** under A, the user sees "..."; under B, they see "...".
- **What it costs:** what A gives up, or what extra it needs.
- **Reversible by:** how it is undone, and at what cost.

**Decision:** _unanswered — TASK-2 is blocked_

---

### ⬜ Q2 · ⚠️ <the question, in one line>

**Blocks:** TASK-5 · **Asked when:** before TASK-5 starts

**Why it is open:** what the plan looked at and could not settle from the code.

**Options:**

- **A —** what it means.
  **Consequence:** state it plainly - who gains access to what, what becomes
  unreversible, what breaks for existing clients, what has to be migrated.
- **B —** what it means.
  **Consequence:** the same, for B.

**Recommendation:** B.

- **Why:** the deciding reason, and why A loses.
- **What it looks like:** the concrete outcome of each option.
- **What it costs:** what B gives up.
- **Reversible by:** how it is undone, and at what cost.

**Consequence of getting this wrong:** the concrete failure - "any authenticated
user could read another user's invoices by guessing the ID", not "a security
concern". Name it in the terms an incident report would use.

**Decision:** _unanswered — TASK-5 is blocked_

---

### ✅ Q3 · 🟦 <answered example>

**Blocks:** TASK-7 · **Asked when:** before TASK-7 starts

**Recommendation:** A, because ... .

**Decision:** **B** — brief reason, in the owner's terms.
**Provenance:** owner, ahead of time — 2026-01-01, settled in conversation before
TASK-7 was reached. TASK-7 is unblocked and this is not asked again.

---

## When a decision outgrows this file

This file is a working document in a gitignored folder: it dies with the project
folder, and the reasoning dies with it. A decision that a future reader will need
belongs in the repository instead.

Graduate a decision to the repo's decision record when all three hold - the same
bar the plan uses for the ⚠️ mark, applied after the fact:

1. **Hard to reverse** - changing your mind later has a real cost.
2. **Surprising without context** - a future reader will ask why it was done this
   way.
3. **A genuine trade-off** - there were real alternatives and one was chosen for
   stated reasons.

`.claude/workflow.json` `decisions.adrDir` says where those live. When the repo
has no such place, say so once when the decision is made, rather than letting the
rationale disappear quietly.
