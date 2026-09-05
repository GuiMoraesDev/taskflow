# Open questions — <Short Title>

Decisions the plan cannot make on its own. Each is numbered, ordered by the task
that needs it, owned by the repo owner, and answered **here** - not in a chat
message that scrolls away.

Risk: 🟦 routine · ⚠️ critical

| Mark | Means                                                                                                                    | If still unanswered when its task comes up                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 🟦   | A preference, a name, a default. The recommendation is safe to live with and cheap to reverse                            | Apply the recommendation, record it here as _applied by default_, and log it |
| ⚠️   | Hard, expensive to reverse, narrowly specific to this business, high priority, **or carrying any security consequence** | **Stop.** The task does not start. Never apply the recommendation silently   |

⚠️ is not a mood. It applies whenever the answer changes who can read or write
data, crosses a trust boundary, or touches authorization - an object reference
that is not ownership-checked (IDOR), a permission default, a token lifetime, a
field added to a public response, a rate limit, anything logged. If the wrong
answer here would be a vulnerability rather than a preference, it is ⚠️.

**Every question carries a recommendation.** A question posed without one is
unfinished work handed to the owner.

---

### Q1 · 🟦 <the question, in one line>

**Blocks:** TASK-2 · **Asked when:** before TASK-2 starts

**Why it is open:** what the plan looked at and could not settle from the code.

**Options:**

- **A —** what it means, and what it costs.
- **B —** what it means, and what it costs.

**Recommendation:** A, because ... . Reversible by ... .

**Decision:** _unanswered_

---

### Q2 · ⚠️ <the question, in one line>

**Blocks:** TASK-5 · **Asked when:** before TASK-5 starts

**Why it is open:** what the plan looked at and could not settle from the code.

**Options:**

- **A —** what it means.
  **Consequence:** state it plainly - who gains access to what, what becomes
  unreversible, what breaks for existing clients, what has to be migrated.
- **B —** what it means.
  **Consequence:** the same, for B.

**Recommendation:** B, because ... .

**Consequence of getting this wrong:** the concrete failure - "any authenticated
user could read another user's invoices by guessing the ID", not "a security
concern". Name it in the terms an incident report would use.

**Decision:** _unanswered — TASK-5 is blocked_

---

### Q3 · 🟦 <answered example>

**Blocks:** TASK-7 · **Asked when:** before TASK-7 starts

**Recommendation:** A, because ... .

**Decision:** **B** — answered 2026-01-01 by the owner. Brief reason, in their
terms. _(Answered ahead of the task; TASK-7 is unblocked.)_
