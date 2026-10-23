import { expect, test } from 'claude-code/testing'

import type { Segment } from '../../../domain/plan-shape'
import { scaleSegments } from './SegmentedBar'

const run = (count: number, segment: Segment): Segment[] => Array.from({ length: count }, () => segment)

test('one cell per task when the bar fits', () => {
  const segments: Segment[][] = [run(3, 'done'), ['progress', 'pending']]

  expect(scaleSegments(segments, 20)).toEqual(segments)
})

test('a squeezed bar keeps every group and fills the width exactly', () => {
  const segments: Segment[][] = [run(10, 'merged'), run(10, 'done'), run(10, 'pending')]
  const scaled = scaleSegments(segments, 12)

  expect(scaled).toHaveLength(3)
  expect(scaled.every(group => group.length >= 1)).toBe(true)
  expect(scaled.reduce((sum, group) => sum + group.length, 0)).toBe(12 - 2)
  expect(scaled.map(group => group[0])).toEqual(['merged', 'done', 'pending'])
})

test('an in-progress task keeps a cell when its group is squeezed', () => {
  const group: Segment[] = [...run(5, 'done'), 'progress', ...run(14, 'pending')]
  const scaled = scaleSegments([group], 3)

  expect(scaled[0]).toHaveLength(3)
  expect(scaled[0]).toContain('progress')
})
