import type { PlanRow } from '../../types'

import { openQuestions, taskTotals } from './parse'

export type MascotMood = 'idle' | 'working' | 'blocked' | 'asking' | 'done'

const PALETTE: Record<string, string> = {
  A: '#00B4D8',
  B: '#00B7BC',
  D: '#1B3137',
  E: '#D5DFE0',
  G: '#00BD74',
  K: '#11191C',
  M: '#8E2A20',
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

const phase = (step: number, length: number) => Math.floor(step / length) % 2 === 1
const blinks = (step: number, every: number) => step % every < 2
const shut = [CLOSED, CLOSED, CLOSED, LIDS, CLOSED, CLOSED]

function moodFrame(mood: MascotMood, step: number): { visor: string[]; antenna: string } {
  switch (mood) {
    case 'working': {
      const glance = phase(step, 8) ? eyes('YK', 'TK', 'NK') : eyes('KY', 'KT', 'KN')
      return { visor: blinks(step, 40) ? shut : [LIDS, open, glance, glance, open, LIDS], antenna: 'A' }
    }
    case 'idle':
      return {
        visor: phase(step, 15)
          ? [CLOSED, CLOSED, CLOSED, CLOSED, LIDS, open]
          : [CLOSED, CLOSED, CLOSED, LIDS, open, open],
        antenna: 'A',
      }
    case 'blocked': {
      const alarm = phase(step, 4)
      const red = alarm ? eyes('MM', 'MM', 'MM') : eyes('RR', 'RR', 'RR')
      return { visor: [LIDS, red, red, red, red, LIDS], antenna: alarm ? 'A' : 'R' }
    }
    case 'asking': {
      const up = phase(step, 6) ? eyes('YK', 'TK', 'NK') : eyes('KY', 'KT', 'KN')
      return { visor: [LIDS, up, open, open, open, LIDS], antenna: phase(step, 5) ? 'Y' : 'A' }
    }
    case 'done': {
      const green = eyes('GG', 'GG', 'GG')
      return {
        visor: blinks(step, 30) ? shut : [LIDS, green, green, green, green, LIDS],
        antenna: phase(step, 8) ? 'G' : 'A',
      }
    }
  }
}

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
const ARC = ['Y', 'T', 'N']

export type MascotCell = { top?: string; bottom?: string }

export function mascotMood(rows: PlanRow[]): MascotMood {
  const { done, total } = taskTotals(rows)
  const tasks = rows.filter(row => row.kind === 'task')
  if (total === 0) return 'idle'
  if (done === total) return 'done'
  if (tasks.some(row => row.status.startsWith('🚧'))) return 'blocked'
  if (openQuestions(rows).length > 0) return 'asking'
  if (tasks.some(row => row.status.startsWith('🔄'))) return 'working'

  return 'idle'
}

export function mascotFrame(mood: MascotMood, step: number): MascotCell[][] {
  const { visor, antenna } = moodFrame(mood, step)
  const head = HEAD.map(row => row.replaceAll('A', antenna))

  return toCells([...head, ...visor, ...VISOR_BOTTOM])
}

export function mascotSpinner(step: number): MascotCell[][] {
  const visor = Array.from({ length: 6 }, () => [...CLOSED])
  RING.forEach(([row, column], index) => {
    const behind = (step - index + RING.length * 2) % RING.length
    const pixels = visor[row]
    if (pixels) pixels[column] = ARC[behind] ?? 'E'
  })

  return toCells([...HEAD, ...visor.map(pixels => pixels.join('')), ...VISOR_BOTTOM])
}

function toCells(pixels: string[]): MascotCell[][] {
  const rows: MascotCell[][] = []
  for (let y = 0; y < pixels.length; y += 2) {
    const upper = pixels[y] ?? ''
    const lower = pixels[y + 1] ?? ''
    rows.push([...upper].map((top, x) => ({ top: PALETTE[top], bottom: PALETTE[lower[x] ?? '.'] })))
  }

  return rows
}
