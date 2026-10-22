import { expect, test } from 'claude-code/testing'

import type { PlanRow } from '../../types'
import { groupByPullRequest, nextTask, prSegments } from './plan-shape'

const row = (kind: PlanRow['kind'], id: string, status: string): PlanRow => ({
  id,
  kind,
  status,
  owner: '',
  summary: '',
  prNumber: null,
  branch: null,
})

const merged = row('pr', 'PR-1', '✅ merged #24')
const open = row('pr', 'PR-2', '👀 ready #26')
const rows = [
  merged,
  row('task', 'TASK-1', '✅ done'),
  row('task', 'TASK-2', '✅ done'),
  row('task', 'TASK-3', '✅ done'),
  open,
  row('task', 'TASK-4', '✅ done'),
  row('task', 'TASK-5', '🔄 in progress'),
  row('question', 'Q1', '⬜ unanswered'),
  row('task', 'TASK-6', '⬜ pending'),
]

test("tasks after PR-2's row belong to PR-2, counted 1/3", () => {
  const groups = groupByPullRequest(rows)

  expect(groups.map(group => group.pr?.id)).toEqual(['PR-1', 'PR-2'])
  expect(groups[1]?.tasks.map(task => task.id)).toEqual(['TASK-4', 'TASK-5', 'TASK-6'])
  expect([groups[1]?.done, groups[1]?.total]).toEqual([1, 3])
})

test('a merged PR paints all its tasks merged', () => {
  expect(prSegments(rows)).toEqual([
    ['merged', 'merged', 'merged'],
    ['done', 'progress', 'pending'],
  ])
  expect(prSegments([row('task', 'TASK-7', '🚧 blocked')])).toEqual([['pending']])
})

test('tasks before the first PR form a leading segment', () => {
  const leading = [row('task', 'TASK-0', '✅ done'), row('task', 'TASK-0b', '⬜ pending'), ...rows]
  const groups = groupByPullRequest(leading)

  expect(groups[0]?.pr).toBeNull()
  expect(groups[0]?.tasks.map(task => task.id)).toEqual(['TASK-0', 'TASK-0b'])
  expect(prSegments(leading)[0]).toEqual(['done', 'pending'])
  expect(groups).toHaveLength(3)
})

const agreed = row('pr', 'PR-3', '✅ agreed')

test('skips a ⬜ task under a 📋 PR', () => {
  const discussed = row('pr', 'PR-1', '📋 criteria in discussion')
  const skipped = row('task', 'TASK-2', '⬜ pending')
  const next = row('task', 'TASK-7', '⬜ pending')

  expect(nextTask([discussed, skipped, agreed, next])).toBe(next)
  expect(nextTask([discussed, skipped])).toBeNull()
})

test('skips a ⬜ task under an unanswered question, but not under an answered one', () => {
  const blocked = row('task', 'TASK-4', '⬜ pending')
  const afterAnswered = row('task', 'TASK-5', '⬜ pending')
  const free = row('task', 'TASK-6', '⬜ pending')
  const unanswered = [agreed, row('question', 'Q1', '⬜ unanswered'), blocked, free]
  const answered = [agreed, row('question', 'Q2', '✅ answered'), afterAnswered, free]
  const mixed = [agreed, row('question', 'Q3', '✅ answered'), row('question', 'Q4', '🚧 asked'), blocked, free]

  expect(nextTask(unanswered)).toBe(free)
  expect(nextTask(answered)).toBe(afterAnswered)
  expect(nextTask(mixed)).toBe(free)
})

test('none when every task is ✅', () => {
  const done = [agreed, row('task', 'TASK-1', '✅ done'), row('task', 'TASK-2', '✅ done')]

  expect(nextTask(done)).toBeNull()
  expect(nextTask([...done, row('task', 'TASK-3', '🔄 in progress')])).toBeNull()
})
