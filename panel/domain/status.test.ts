import { expect, test } from 'claude-code/testing'

import type { PlanProject, PlanRow } from '../../types'
import { boardStatus, isPlanActive, planStatus } from './status'

const row = (kind: PlanRow['kind'], id: string, status: string): PlanRow => ({
  id,
  kind,
  status,
  owner: '',
  summary: '',
  prNumber: null,
  branch: null,
})
const plan = (name: string, rows: PlanRow[]): PlanProject => ({ name, title: `Title of ${name}`, rows, updatedAt: 0 })

const started = plan('Rollout', [
  row('task', 'TASK-1', '✅ done'),
  row('task', 'TASK-2', '🔄 in progress'),
  row('question', 'Q1', '⬜ open'),
])
const untouched = plan('Docs', [row('task', 'TASK-1', '⬜ pending')])
const finished = plan('Cleanup', [row('task', 'TASK-1', '✅ done')])

test('a plan is active once a task started and until every task is done', () => {
  expect(isPlanActive(started)).toBe(true)
  expect(isPlanActive(untouched)).toBe(false)
  expect(isPlanActive(finished)).toBe(false)
})

test('the plan list counts plans, active plans and what is moving', () => {
  expect(boardStatus([])).toEqual({ headline: 'No plans yet.', details: [] })
  expect(boardStatus([started, untouched, finished])).toEqual({
    headline: '3 plans · 1 active',
    details: ['1 task in progress · 1 open question'],
  })
  expect(boardStatus([untouched])).toEqual({ headline: '1 plan · 0 active', details: ['Nothing in progress'] })
})

test('a plan page names the plan, carries its progress and what needs attention', () => {
  expect(planStatus(started)).toEqual({
    headline: "Viewing 'Rollout' plan",
    progress: { done: 1, total: 2 },
    details: ['TASK-2 in progress · 1 open question'],
  })
  expect(planStatus(untouched)).toEqual({
    headline: "Viewing 'Docs' plan",
    progress: { done: 0, total: 1 },
    details: [],
  })
  const stuck = plan('Stuck', [row('task', 'TASK-4', '🔄 in progress'), row('task', 'TASK-5', '🚧 blocked')])
  expect(planStatus(stuck).details).toEqual(['TASK-5 blocked'])
})
