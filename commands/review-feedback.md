---
description: Judge a pull request's review comments, log each one, and suggest a process change
argument-hint: "<pr number>"
allowed-tools: Read, Edit, Glob, Grep, Bash
---

Learn from the review of pull request `$1`. Read GitHub; write nothing to it.

1. **Fetch.** Resolve `{owner}/{repo}` with `gh repo view --json nameWithOwner`.
   Read the pull request (`gh api repos/{owner}/{repo}/pulls/$1`: title, head
   branch, body), its inline comments
   (`gh api repos/{owner}/{repo}/pulls/$1/comments`) and its reviews
   (`gh api repos/{owner}/{repo}/pulls/$1/reviews`), keeping only reviews whose
   body is non-empty. Replies count as part of the thread they answer.

2. **Set pointers aside.** A comment the workflow posted itself - one sentence
   starting "Look here:", as `task-run` step 9 writes them - is a pointer, not
   feedback. List it as `pointer` and judge nothing in it. A reply under a
   pointer is feedback.

3. **Nothing to learn.** When no feedback is left, report
   `PR #$1: nothing to learn` - with the pointer count, if any - and stop.
   Change no file.

4. **Find the plan.** Locate the plan dir as the `plan-start` skill's **Where
   plans live** section says, and the project whose `TASKS.md` names the pull
   request's head branch or number. When no plan names either, stop and ask
   the owner which plan it belongs to; write nothing until they answer. Read its criteria for this pull request,
   the repo's `CLAUDE.md`, and the code each comment points at, at the pull
   request's head.

5. **Judge each comment** against those three - the criteria, the code and
   `CLAUDE.md` - never by deference to the reviewer. A reviewer can be wrong.

   | Verdict | When |
   | ------- | ---- |
   | **valid** | The comment is right and the change it asks for belongs in this pull request |
   | **partly valid** | Part of it holds; say which part |
   | **not applicable** | Wrong, already handled, out of scope, or contradicts an agreed criterion or `CLAUDE.md` |

   Give each a one-line reason, and a cause:

   | Cause | The miss was in |
   | ----- | --------------- |
   | spec gap | the criteria never said it |
   | test gap | the criteria said it, no test proved it |
   | implementation | the test passed, the code is still wrong |
   | review miss | `pr-reviewer` or the self-check should have caught it |
   | taste | a preference no rule decides |

6. **Log.** Append one session-log entry per comment to the plan's
   `PROGRESS.md`, in the shape its template shows: the comment's link, the
   verdict, the cause, and the fix - the new task - or the reason for no
   action.

7. **Tasks.** Each valid comment, and the valid part of a partly valid one,
   becomes a new task on the same pull request's branch, added to `TASKS.md`
   and to the pull request's rows in `PROGRESS.md` as ⬜, with a model tier as
   `plan-start` assigns one. Do not start them.

8. **Report**, and nothing else:

   ```
   PR #<n> - <k> comments, <p> pointers

   | Comment | Verdict | Cause | Action |
   | ------- | ------- | ----- | ------ |
   | <path:line or review>: <gist> | valid | test gap | TASK-9 |

   Process change: <skill> <step or section>: <the change>.
   ```

   At least one process change, derived from the causes - the commonest cause
   first. Name the skill and the section to change, e.g. "plan-start step 7: add
   an example input and output to each criterion". Suggest; edit no skill. A
   run whose every comment is taste may say "none - every comment was taste". A nothing-to-learn run (step 3) makes no
   process suggestion.

Reply to nothing on GitHub. If a reply would help, draft it in the report and
post it only when the owner approves.
