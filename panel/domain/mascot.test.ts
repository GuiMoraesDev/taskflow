import { expect, test } from 'claude-code/testing'

import type { PlanRow } from '../../types'
import { endsOnQuestion, mascotFrame, mascotMood, mascotSpinner } from './mascot'
import { MASCOT_ANIMATIONS } from './mascot-frames'

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

test('every mood frame and the spinner draw 4 rows of 12 cells at every step', () => {
  const moods = ['idle', 'working', 'blocked', 'asking', 'done'] as const
  for (const mood of moods) {
    for (let step = 0; step < 47; step++) {
      const rows = mascotFrame(mood, step)
      expect(rows.length).toBe(4)
      for (const cells of rows) expect(cells.length).toBe(12)
    }
  }
  for (let step = 0; step < 8; step++) {
    const rows = mascotSpinner(step)
    expect(rows.length).toBe(4)
    for (const cells of rows) expect(cells.length).toBe(12)
  }
})

test('the spinner arc moves one pixel per step and wraps after a full turn of 8', () => {
  const heads = (step: number) =>
    mascotSpinner(step).flatMap((cells, row) =>
      cells.flatMap((cell, column) => [
        ...(cell.top === '#FFBF36' ? [`${row * 2}:${column}`] : []),
        ...(cell.bottom === '#FFBF36' ? [`${row * 2 + 1}:${column}`] : []),
      ]),
    )
  expect(heads(0)).toEqual(['3:6'])
  expect(heads(1)).toEqual(['4:7'])
  expect(heads(8)).toEqual(heads(0))
  expect(mascotSpinner(0).length).toBe(4)
})

test('each mood animates: some later step draws a different frame', () => {
  const moods = ['idle', 'working', 'blocked', 'asking', 'done'] as const
  for (const mood of moods) {
    const first = JSON.stringify(mascotFrame(mood, 0))
    const changes = Array.from({ length: 47 }, (_, step) => JSON.stringify(mascotFrame(mood, step))).some(
      frame => frame !== first,
    )
    expect(changes).toBe(true)
  }
})

test('each animation loops for its agreed number of steps', () => {
  const loop = (mood: keyof typeof MASCOT_ANIMATIONS) =>
    MASCOT_ANIMATIONS[mood].reduce((total, { steps }) => total + steps, 0)
  expect(loop('idle')).toBe(47)
  expect(loop('working')).toBe(8)
  expect(loop('blocked')).toBe(8)
  expect(loop('asking')).toBe(24)
  expect(loop('done')).toBe(16)
  expect(loop('loading')).toBe(8)
})

test('a 🔄 task with a 👀 PR and no open question is asking', () => {
  expect(mascotMood([row('task', '🔄 in progress'), row('pr', '👀 in review')])).toBe('asking')
})

test('📋 criteria with a 🔄 task is asking', () => {
  expect(mascotMood([row('task', '🔄 in progress'), row('pr', '📋 criteria')])).toBe('asking')
})

test('🚧 still beats a needs-you item', () => {
  expect(mascotMood([row('task', '🚧 blocked'), row('pr', '👀 in review'), row('question', '⬜ open')])).toBe('blocked')
})

test('a session waiting on the owner is asking, even with no plan item', () => {
  expect(mascotMood([], { waiting: true })).toBe('asking')
  expect(mascotMood([row('task', '✅ done')], { waiting: true })).toBe('asking')
  expect(mascotMood([row('task', '🔄 in progress')], { waiting: true })).toBe('asking')
})

test('🚧 beats a session wait', () => {
  expect(mascotMood([row('task', '🚧 blocked')], { waiting: true })).toBe('blocked')
})

test("a turn ending in '?' waits; one ending in '.' does not", () => {
  expect(endsOnQuestion('Shall I open the PR?')).toBe(true)
  expect(endsOnQuestion('Which option do you prefer?**  \n')).toBe(true)
  expect(endsOnQuestion('Run `npm test`?`)')).toBe(true)
  expect(endsOnQuestion('Done. Is it fine? I opened the PR.')).toBe(false)
  expect(endsOnQuestion('')).toBe(false)
})
