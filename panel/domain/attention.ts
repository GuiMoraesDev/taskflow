import type { PlanProject, PlanRow } from '../../types'
import { isQuestionOpen } from './parse'

export type NeedsYouItem = {
  kind: 'question' | 'review' | 'criteria'
  id: string
  plan: string
  project: string
  unblocks: string | null
  prNumber: number | null
}

export type PlanBadge = { kind: 'blocked' } | { kind: 'attention'; count: number } | { kind: 'none' }

export function isNeedsYou(row: PlanRow): boolean {
  if (row.kind === 'question') return isQuestionOpen(row.status)

  return row.kind === 'pr' && (row.status.startsWith('👀') || row.status.startsWith('📋'))
}

function toItem(project: PlanProject, row: PlanRow): NeedsYouItem | null {
  if (!isNeedsYou(row)) return null
  const base = { id: row.id, plan: project.title, project: project.name, unblocks: null, prNumber: null }

  if (row.kind === 'question') {
    return { ...base, kind: 'question', unblocks: /blocks (TASK-\d+)/.exec(row.summary)?.[1] ?? null }
  }

  return row.status.startsWith('👀')
    ? { ...base, kind: 'review', prNumber: row.prNumber }
    : { ...base, kind: 'criteria' }
}

export function needsYou(project: PlanProject): NeedsYouItem[] {
  return project.rows.map(row => toItem(project, row)).filter(item => item !== null)
}

export function boardNeedsYou(projects: PlanProject[]): NeedsYouItem[] {
  return projects.flatMap(needsYou)
}

export function planBadge(project: PlanProject): PlanBadge {
  if (project.rows.some(row => row.kind === 'task' && row.status.startsWith('🚧'))) return { kind: 'blocked' }

  const count = needsYou(project).length

  return count > 0 ? { kind: 'attention', count } : { kind: 'none' }
}

export function currentTask(rows: PlanRow[]): PlanRow | null {
  const tasks = rows.filter(row => row.kind === 'task')

  return tasks.find(row => row.status.startsWith('🔄')) ?? tasks.find(row => row.status.startsWith('🚧')) ?? null
}
