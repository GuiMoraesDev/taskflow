import { expect, test } from 'claude-code/testing'

import type { PlanRow } from '../../types'
import { mascotArt, mascotLine, mascotMood } from './mascot'

const row = (kind: PlanRow['kind'], status: string): PlanRow => ({
  id: 'X',
  kind,
  status,
  owner: '',
  summary: '',
  prNumber: null,
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
    const rows = mascotArt(mood)
    expect(rows.length).toBe(7)
    for (const cells of rows) expect(cells.length).toBe(20)
  }
})
