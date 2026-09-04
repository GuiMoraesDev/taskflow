---
description: Set up or reconcile the plan-and-task workflow config for this repo
argument-hint: ""
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

Follow the `init-workflow` skill end to end: detect the repo's real scripts and
layout, ask which model takes each difficulty tier and whether diagrams are
kept, then write `.claude/workflow.json` and the CLAUDE.md workflow section.

If `.claude/workflow.json` already exists, this is a re-run - the skill's step 0
governs: report drift against the current file and ask only about what changed,
never silently overwrite an existing answer.
