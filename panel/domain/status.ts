import type { PlanProject, PlanRow } from '../../types'
import { openQuestions, taskTotals } from './parse'

const tasksWith = (rows: PlanRow[], mark: string) =>
  rows.filter(row => row.kind === 'task' && row.status.startsWith(mark))
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
const joined = (parts: (string | false)[]) => parts.filter(part => part !== false).join(' · ')

export function isPlanActive(project: PlanProject) {
  const { done, total } = taskTotals(project.rows)
  const started = project.rows.some(row => row.kind === 'task' && !row.status.startsWith('⬜'))

  return started && done < total
}

export type FloStatus = { headline: string; progress?: { done: number; total: number }; details: string[] }

export function boardStatus(projects: PlanProject[]): FloStatus {
  if (projects.length === 0) return { headline: 'No plans yet.', details: [] }
  const rows = projects.flatMap(project => project.rows)
  const inProgress = tasksWith(rows, '🔄').length
  const blocked = tasksWith(rows, '🚧').length
  const questions = openQuestions(rows).length
  const activity = joined([
    inProgress > 0 && plural(inProgress, 'task in progress', 'tasks in progress'),
    blocked > 0 && `${blocked} blocked`,
    questions > 0 && plural(questions, 'open question', 'open questions'),
  ])

  return {
    headline: `${plural(projects.length, 'plan', 'plans')} · ${projects.filter(isPlanActive).length} active`,
    details: [activity || 'Nothing in progress'],
  }
}

export function planStatus(project: PlanProject): FloStatus {
  const { done, total } = taskTotals(project.rows)
  const blocked = tasksWith(project.rows, '🚧')[0]
  const working = tasksWith(project.rows, '🔄')[0]
  const questions = openQuestions(project.rows).length
  const attention = joined([
    blocked ? `${blocked.id} blocked` : working ? `${working.id} in progress` : false,
    questions > 0 && plural(questions, 'open question', 'open questions'),
  ])

  return {
    headline: `Viewing '${project.name}' plan`,
    progress: { done, total },
    details: attention ? [attention] : [],
  }
}
