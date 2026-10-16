import type { PlanRow } from '../../types'

import { isQuestionOpen, taskTotals } from './parse'

export type MascotMood = 'idle' | 'working' | 'blocked' | 'asking' | 'done'

const PALETTE: Record<string, string> = {
  A: '#00B4D8',
  B: '#00B7BC',
  D: '#1B3137',
  E: '#D5DFE0',
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

// The loading spinner's ring on the visor, in clockwise order from the top: [row, column].
const RING: [number, number][] = [
  [0, 8],
  [0, 9],
  [1, 10],
  [2, 11],
  [3, 11],
  [4, 10],
  [5, 9],
  [5, 8],
  [4, 7],
  [3, 6],
  [2, 6],
  [1, 7],
]
// The spinning arc, head first, fading into the faint track the rest of the ring shows.
const ARC = ['Y', 'T', 'N']

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

export function mascotArt(mood: MascotMood): MascotCell[][] {
  return toCells(FRAMES[mood])
}

// Flo with a spinner where the eyes are: each step moves the arc one pixel clockwise.
export function mascotSpinner(step: number): MascotCell[][] {
  const visor = Array.from({ length: 6 }, () => [...CLOSED])
  RING.forEach(([row, column], index) => {
    const behind = (step - index + RING.length * 2) % RING.length
    const pixels = visor[row]
    if (pixels) pixels[column] = ARC[behind] ?? 'E'
  })

  return toCells([...HEAD, ...visor.map(pixels => pixels.join('')), ...VISOR_BOTTOM])
}

// Two pixel rows share one terminal row: the top pixel paints the glyph, the bottom one its background.
function toCells(pixels: string[]): MascotCell[][] {
  const rows: MascotCell[][] = []
  for (let y = 0; y < pixels.length; y += 2) {
    const upper = pixels[y] ?? ''
    const lower = pixels[y + 1] ?? ''
    rows.push([...upper].map((top, x) => ({ top: PALETTE[top], bottom: PALETTE[lower[x] ?? '.'] })))
  }

  return rows
}
