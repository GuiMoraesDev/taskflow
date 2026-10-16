import type { PlanRow } from '../../types'

import { isQuestionOpen, taskTotals } from './parse'

export type MascotMood = 'idle' | 'working' | 'blocked' | 'asking' | 'done'

const PALETTE: Record<string, string> = {
  A: '#00B4D8',
  B: '#00B7BC',
  D: '#1B3137',
  G: '#00BD74',
  K: '#11191C',
  N: '#91513C',
  R: '#F36353',
  S: '#1F6D75',
  T: '#C6966D',
  W: '#FFFFFF',
  Y: '#FFBF36',
}

const HEAD = [
  '............AA......',
  '...........AAAA.....',
  '....BBBBBBBAAAABBB..',
  '.BBBBBBBBBBBBBBBBBSS',
  'DDDDDDDDDDDDDDDDDDSS',
  'DWWWWWWWWWWWWWWWWDSS',
]
const VISOR_BOTTOM = ['DWWWWWWWWWWWWWWWWDSS', 'DDDDDDDDDDDDDDDDDDSS']
const LIDS = 'DWDDDDWDDDDWDDDDWDSS'
const CLOSED = 'DWWWWWWWWWWWWWWWWDSS'
const eyes = (left: string, middle: string, right: string) => `DWD${left}DWD${middle}DWD${right}DWDSS`
const open = eyes('YY', 'TT', 'NN')

const FRAMES: Record<MascotMood, string[]> = {
  working: [...HEAD, LIDS, open, open, open, open, LIDS, ...VISOR_BOTTOM],
  idle: [...HEAD, CLOSED, CLOSED, CLOSED, LIDS, open, open, ...VISOR_BOTTOM],
  blocked: [...HEAD, LIDS, ...Array(4).fill(eyes('RR', 'RR', 'RR')), LIDS, ...VISOR_BOTTOM],
  asking: [...HEAD, LIDS, eyes('YK', 'TK', 'NK'), open, open, open, LIDS, ...VISOR_BOTTOM],
  done: [...HEAD, LIDS, ...Array(4).fill(eyes('GG', 'GG', 'GG')), LIDS, ...VISOR_BOTTOM],
}

export const MASCOT_SPEECH_ROW = 4

export type MascotCell = { top?: string; bottom?: string }

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

// Two pixel rows share one terminal row: the top pixel paints the glyph, the bottom one its background.
export function mascotArt(mood: MascotMood): MascotCell[][] {
  const pixels = FRAMES[mood]
  const rows: MascotCell[][] = []
  for (let y = 0; y < pixels.length; y += 2) {
    rows.push([...pixels[y]].map((top, x) => ({ top: PALETTE[top], bottom: PALETTE[pixels[y + 1][x]] })))
  }

  return rows
}
