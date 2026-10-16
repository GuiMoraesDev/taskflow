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
  expect(boardStatus([])).toEqual(['No plans yet.'])
  expect(boardStatus([started, untouched, finished])).toEqual([
    '3 plans · 1 active',
    '1 task in progress · 1 open question',
  ])
  expect(boardStatus([untouched])).toEqual(['1 plan · 0 active', 'Nothing in progress'])
})

test('a plan page names the plan, its progress and the task that matters now', () => {
  expect(planStatus(started)).toEqual([
    "Viewing 'Rollout' plan",
    '1/2 tasks done · TASK-2 in progress · 1 open question',
  ])
  expect(planStatus(finished)).toEqual(["Viewing 'Cleanup' plan", '1/1 tasks done · all done'])
  const stuck = plan('Stuck', [row('task', 'TASK-4', '🔄 in progress'), row('task', 'TASK-5', '🚧 blocked')])
  expect(planStatus(stuck)[1]).toBe('0/2 tasks done · TASK-5 blocked')
})
