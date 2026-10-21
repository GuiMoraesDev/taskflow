import { expect, test } from 'claude-code/testing'

import { clearTargets, isDirectChild, isPlanFolder, parseTrashEntry, recoverDecision, trashEntryName } from './trash'

const BASE = '/vault/plans'

test('names a trash entry with the plan and timestamp', () => {
  const name = trashEntryName('my-plan', new Date(2026, 9, 21, 9, 5, 7))

  expect(name).toBe('my-plan--20261021-090507')
  expect(parseTrashEntry(name)).toEqual({
    entry: name,
    name: 'my-plan',
    deletedAt: new Date(2026, 9, 21, 9, 5, 7).getTime(),
  })
  expect(parseTrashEntry('a--b--20261021-090507')).toEqual(expect.objectContaining({ name: 'a--b' }))
  expect(parseTrashEntry('not-a-trash-entry')).toBe(null)
})

test('refuses a target outside the base', () => {
  expect(isDirectChild(BASE, '/vault/plans/p')).toBe(true)
  expect(isDirectChild(`${BASE}/`, '/vault/plans/p')).toBe(true)
  expect(isDirectChild(BASE, '/vault/other/p')).toBe(false)
  expect(isDirectChild(BASE, '/vault/plans')).toBe(false)
  expect(isDirectChild(BASE, '/vault/plans/p/nested')).toBe(false)
  expect(isDirectChild(BASE, '/vault/plans-evil/p')).toBe(false)
  expect(isDirectChild(BASE, '/vault/plans/..')).toBe(false)
})

test('refuses recover onto an existing plan', () => {
  expect(recoverDecision('p--20261021-090507', ['p', 'q'])).toEqual({
    error: expect.stringContaining('"p" already exists'),
  })
  expect(recoverDecision('p--20261021-090507', ['q'])).toEqual({ name: 'p' })
  expect(recoverDecision('../etc--20261021-090507', [])).toEqual({ error: expect.any(String) })
})

test('scopes clear to the .trash folder', () => {
  expect(clearTargets(BASE, ['p--20261021-090507', 'q'])).toEqual([
    '/vault/plans/.trash/p--20261021-090507',
    '/vault/plans/.trash/q',
  ])
  expect(clearTargets(BASE, ['..', '.', '', 'a/b'])).toEqual([])
})

test('never lists .trash as a plan', () => {
  expect(isPlanFolder('.trash')).toBe(false)
  expect(isPlanFolder('my-plan')).toBe(true)
})
