---
name: bug-red-test
description: Prove a regression test actually catches the bug by watching it fail against the old behaviour before the fix ships. Use for any change that claims to fix a defect, and when the user says "add a regression test" or "verify the test fails first".
---

# bug-red-test

A test written from a bug's **description** rather than its **mechanism** tends
to pass either way. This procedure is what separates the two.

## Procedure

1. **Name the mechanism.** One sentence: the exact state and input under which
   the wrong behaviour occurs. If you cannot write that sentence, you do not yet
   understand the bug - go read, do not go write.
2. **Write the test against the mechanism**, not the symptom. It asserts on the
   observable outcome the mechanism corrupts.
3. **Make it red.** Either write the test before the fix, or - when the fix is
   already applied - revert the fix (`git stash` the fix hunk, or flip the changed
   line back), run the suite, and watch the new test fail.
4. **Read the failure.** It must fail for the bug's reason. A failure from a
   missing import, a bad fixture or an unrelated assertion proves nothing - fix
   the test and repeat step 3.
5. **Restore the fix.** Run the suite again, green.
6. **Record it** in the session log: what the defect actually was, and that the
   test was verified failing against the old behaviour.

## Do not

- Skip step 3 because the test "obviously" covers it. That belief is what this
  step exists to check.
- Leave the revert in place. Verify the tree is back to the fixed state before
  the gates run.
- Name the test after the plan or the ticket. It states the behaviour:
  `it("appends the username on a drop")`, not `it("fixes TASK-3")`.
