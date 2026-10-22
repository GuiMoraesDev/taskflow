import type { PlanRow } from '../../types'

import { MASCOT_ANIMATIONS, type MascotKeyframe } from './mascot-frames'
import { isNeedsYou } from './attention'
import { taskTotals } from './parse'

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

function keyframeAt(keyframes: MascotKeyframe[], step: number): string[] {
  const loop = keyframes.reduce((total, { steps }) => total + steps, 0)
  let elapsed = step % loop
  for (const { steps, rows } of keyframes) {
    if (elapsed < steps) return rows
    elapsed -= steps
  }

  return keyframes[0]?.rows ?? []
}

export type MascotCell = { top?: string; bottom?: string }

export type MascotContext = { waiting?: boolean }

export function mascotMood(rows: PlanRow[], { waiting = false }: MascotContext = {}): MascotMood {
  const { done, total } = taskTotals(rows)
  const tasks = rows.filter(row => row.kind === 'task')
  if (tasks.some(row => row.status.startsWith('🚧'))) return 'blocked'
  if (waiting || rows.some(isNeedsYou)) return 'asking'
  if (tasks.some(row => row.status.startsWith('🔄'))) return 'working'
  if (total > 0 && done === total) return 'done'

  return 'idle'
}

export function endsOnQuestion(text: string): boolean {
  return /\?[\s*_`)"']*$/.test(text)
}

export function mascotFrame(mood: MascotMood, step: number): MascotCell[][] {
  return toCells(keyframeAt(MASCOT_ANIMATIONS[mood], step))
}

export function mascotSpinner(step: number): MascotCell[][] {
  return toCells(keyframeAt(MASCOT_ANIMATIONS.loading, step))
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
