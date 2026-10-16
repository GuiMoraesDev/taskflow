import { expect, test } from 'claude-code/testing'

import type { PlanRow } from '../../types'
import { mascotFrame, mascotLine, mascotMood, mascotSpinner } from './mascot'

const row = (kind: PlanRow['kind'], status: string): PlanRow => ({
  id: 'X',
  kind,
  status,
  owner: '',
  summary: '',
  prNumber: null,
  branch: null,
})

test('mascot mood follows the plan', () => {
  expect(mascotMood([])).toBe('idle')
  expect(mascotMood([row('task', '✅ done')])).toBe('done')
  expect(mascotMood([row('task', '🚧 blocked'), row('task', '🔄 in progress')])).toBe('blocked')
  expect(mascotMood([row('task', '🔄 in progress'), row('question', '⬜ open')])).toBe('asking')
  expect(mascotMood([row('task', '🔄 in progress')])).toBe('working')
  expect(mascotMood([row('task', '⬜ pending')])).toBe('idle')
})

test('mascot line counts remaining tasks', () => {
  expect(mascotLine('working', 2)).toBe('2 task(s) to go.')
  expect(mascotLine('idle', 0)).toBe('No tasks yet.')
})

test('every mood frame is the same full-cell grid', () => {
  const moods = ['idle', 'working', 'blocked', 'asking', 'done'] as const
  for (const mood of moods) {
    const rows = mascotFrame(mood, 0)
    expect(rows.length).toBe(7)
    for (const cells of rows) expect(cells.length).toBe(20)
  }
})

test('the spinner arc moves one pixel per step and wraps after a full turn', () => {
  const heads = (step: number) =>
    mascotSpinner(step).flatMap((cells, row) =>
      cells.flatMap((cell, column) => [
        ...(cell.top === '#FFBF36' ? [`${row * 2}:${column}`] : []),
        ...(cell.bottom === '#FFBF36' ? [`${row * 2 + 1}:${column}`] : []),
      ]),
    )
  expect(heads(0)).toEqual(['6:8'])
  expect(heads(1)).toEqual(['6:9'])
  expect(heads(12)).toEqual(heads(0))
  expect(mascotSpinner(0).length).toBe(7)
})

test('each mood animates: some later step draws a different frame', () => {
  const moods = ['idle', 'working', 'blocked', 'asking', 'done'] as const
  for (const mood of moods) {
    const first = JSON.stringify(mascotFrame(mood, 0))
    const changes = Array.from({ length: 40 }, (_, step) => JSON.stringify(mascotFrame(mood, step))).some(
      frame => frame !== first,
    )
    expect(changes).toBe(true)
  }
})
