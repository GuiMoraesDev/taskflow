import { expect, test } from 'claude-code/testing'

import type { PlanProject, PlanRow } from '../../types'
import { boardNeedsYou, currentTask, needsYou, planBadge } from './attention'

const row = (
  kind: PlanRow['kind'],
  id: string,
  status: string,
  summary = '',
  prNumber: number | null = null,
): PlanRow => ({
  id,
  kind,
  status,
  owner: '',
  summary,
  prNumber,
  branch: null,
})
const plan = (name: string, rows: PlanRow[]): PlanProject => ({ name, title: `Title of ${name}`, rows, updatedAt: 0 })

const item = (
  kind: 'question' | 'review' | 'criteria',
  id: string,
  name: string,
  extra: { unblocks?: string | null; prNumber?: number | null } = {},
) => ({ kind, id, plan: `Title of ${name}`, project: name, unblocks: null, prNumber: null, ...extra })

test('⬜ and 🚧 questions are listed with what they unblock, ✅ excluded', () => {
  const rollout = plan('Rollout', [
    row('question', 'Q1', '✅ answered', 'Pick a name — blocks TASK-3'),
    row('question', 'Q2', '⬜ open', 'Pick a store — blocks TASK-6'),
    row('question', 'Q3', '🚧 partly answered', 'Pick a format'),
  ])

  expect(needsYou(rollout)).toEqual([
    item('question', 'Q2', 'Rollout', { unblocks: 'TASK-6' }),
    item('question', 'Q3', 'Rollout'),
  ])
})

test('a ready PR asks for review, criteria in discussion asks for agreement, other PR states ask nothing', () => {
  const rollout = plan('Rollout', [
    row('pr', 'PR-1', '👀 ready #26', '', 26),
    row('pr', 'PR-2', '📋 criteria in discussion'),
    row('pr', 'PR-3', '📝 draft'),
    row('pr', 'PR-4', '⬜ not opened'),
    row('pr', 'PR-5', '✅ merged'),
  ])

  expect(needsYou(rollout)).toEqual([
    item('review', 'PR-1', 'Rollout', { prNumber: 26 }),
    item('criteria', 'PR-2', 'Rollout'),
  ])
})

test("boardNeedsYou lists every plan's items in plan order", () => {
  const first = plan('First', [row('pr', 'PR-1', '👀 ready #7', '', 7)])
  const quiet = plan('Quiet', [row('task', 'TASK-1', '⬜ pending')])
  const last = plan('Last', [row('question', 'Q1', '⬜ open', 'Which? — blocks TASK-2')])

  expect(boardNeedsYou([first, quiet, last])).toEqual([
    item('review', 'PR-1', 'First', { prNumber: 7 }),
    item('question', 'Q1', 'Last', { unblocks: 'TASK-2' }),
  ])
  expect(boardNeedsYou([])).toEqual([])
})

test('the current task prefers 🔄 over 🚧, and is null with neither', () => {
  const blocked = row('task', 'TASK-1', '🚧 blocked')
  const moving = row('task', 'TASK-2', '🔄 in progress')
  const pending = row('task', 'TASK-3', '⬜ pending')

  expect(currentTask([blocked, moving, pending])).toBe(moving)
  expect(currentTask([pending, blocked])).toBe(blocked)
  expect(currentTask([row('task', 'TASK-1', '✅ done'), pending])).toBeNull()
  expect(currentTask([])).toBeNull()
})

test('a blocked task beats the attention count in the badge', () => {
  const asks = [row('question', 'Q1', '⬜ open'), row('pr', 'PR-1', '👀 ready #3', '', 3)]

  expect(planBadge(plan('Stuck', [row('task', 'TASK-1', '🚧 blocked'), ...asks]))).toEqual({ kind: 'blocked' })
  expect(planBadge(plan('Asking', [row('task', 'TASK-1', '🔄 in progress'), ...asks]))).toEqual({
    kind: 'attention',
    count: 2,
  })
  expect(planBadge(plan('Calm', [row('task', 'TASK-1', '🔄 in progress')]))).toEqual({ kind: 'none' })
})
