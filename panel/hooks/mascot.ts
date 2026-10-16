import type { PlanRow } from '../types'

import { isQuestionOpen, taskTotals } from './parse'

export type MascotMood = 'idle' | 'working' | 'blocked' | 'asking' | 'done'

const FACES: Record<MascotMood, string> = {
  idle: '( -.- )',
  working: '( o.o )',
  blocked: '( ;_; )',
  asking: '( o.O )',
  done: '( ^.^ )',
}

export function mascotMood(rows: PlanRow[]): MascotMood {
  const { done, total } = taskTotals(rows)
  const tasks = rows.filter(row => row.kind === 'task')
  if (total === 0) return 'idle'
  if (done === total) return 'done'
  if (tasks.some(row => row.status.startsWith('🚧'))) return 'blocked'
  if (rows.some(row => row.kind === 'question' && isQuestionOpen(row.status))) return 'asking'
  if (tasks.some(row => row.status.startsWith('🔄'))) return 'working'

  return 'idle'
}

export function mascotLine(mood: MascotMood, left: number) {
  switch (mood) {
    case 'done':
      return 'All done. Ship it!'
    case 'blocked':
      return 'Something is blocked.'
    case 'asking':
      return 'A question needs an answer.'
    case 'working':
      return `${left} task(s) to go.`
    case 'idle':
      return left === 0 ? 'No tasks yet.' : `${left} task(s) waiting. Press [t].`
  }
}

export function mascotArt(mood: MascotMood) {
  return ['  /\\_/\\', ` ${FACES[mood]}`, '  /|_|\\~']
}
