import { expect, test } from 'claude-code/testing'

import type { PlanRow } from '../../types'
import { groupByPullRequest, prSegments } from './plan-shape'

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
