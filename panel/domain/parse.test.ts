import { expect, test } from 'claude-code/testing'

import { activeTasks, isSafeProjectName, parseProgress, parseWorktrees, repoWebUrl, taskTotals } from './parse'

const PROGRESS = `# Progress — Fix double rollout (CORE-1396)

| Status | ID | Category | Owner | Summary |
| ------ | -- | -------- | ----- | ------- |
| ✅ done | TASK-8 | 🟢 Chore | 🙋 Owner | Paste the selector |
| 👀 ready for review #498 | PR-1 | 🔀 PR | — | ci: Fix staging · \`core-1396-staging-rollout\` · 21/400 |
| ✅ answered | Q7 | ❓ 🟦 | 🙋 Owner | Commit the script? |
| 🔄 in progress | TASK-3 | 🔴 Bug | ⚙️ Sonnet | Add --wait |
| ⬜ pending | TASK-4 | 🟢 Chore | 🙋 Owner | Verify on staging |
| ⬜ not opened | PR-2 | 🔀 PR | — | ci: Fix production |
| ❌ skipped | TASK-9 | 🟢 Chore | 🔧 Haiku | Delete script |
| ⬜ open | Q8 | ❓ ⚠️ | 🙋 Owner | Atomic? |
| 👀 pushed | #465 | 🔀 PR | — | core-1368-list-pause |
`

test('parses the title, tasks, questions and PRs', () => {
  const { title, rows } = parseProgress(PROGRESS)
  expect(title).toBe('Fix double rollout (CORE-1396)')
  expect(rows.map(row => `${row.kind}:${row.id}:${row.prNumber}`)).toEqual([
    'task:TASK-8:null',
    'pr:PR-1:498',
    'question:Q7:null',
    'task:TASK-3:null',
    'task:TASK-4:null',
    'pr:PR-2:null',
    'task:TASK-9:null',
    'question:Q8:null',
    'pr:#465:465',
  ])
})

test('counts skipped tasks as done and lists in-progress before pending', () => {
  const { rows } = parseProgress(PROGRESS)
  expect(taskTotals(rows)).toEqual({ done: 2, total: 4 })
  expect(activeTasks(rows).map(row => row.id)).toEqual(['TASK-3', 'TASK-4'])
})

test('builds the GitHub URL from ssh and https remotes', () => {
  expect(repoWebUrl('git@github.com:Resquared/re2recruit-web-client.git\n')).toBe(
    'https://github.com/Resquared/re2recruit-web-client',
  )
  expect(repoWebUrl('https://github.com/Resquared/re2recruit-web-client')).toBe(
    'https://github.com/Resquared/re2recruit-web-client',
  )
})

test('refuses project names that escape the projects folder', () => {
  expect(isSafeProjectName('core-1396-double-rollout')).toBe(true)
  expect(isSafeProjectName('..')).toBe(false)
  expect(isSafeProjectName('a/../b')).toBe(false)
})

test('reads each pull request branch from its backticked summary', () => {
  const { rows } = parseProgress(PROGRESS)
  const branches = rows.filter(row => row.kind === 'pr').map(row => row.branch)
  expect(branches).toEqual(['core-1396-staging-rollout', null, null])
})

test('maps each checked-out branch to its worktree path', () => {
  const porcelain = `worktree /repo
HEAD abc
branch refs/heads/main

worktree /repo-wt/rollout
HEAD def
branch refs/heads/core-1396-staging-rollout

worktree /repo-wt/detached
HEAD 123
detached
`
  expect(parseWorktrees(porcelain)).toEqual({ main: '/repo', 'core-1396-staging-rollout': '/repo-wt/rollout' })
})
