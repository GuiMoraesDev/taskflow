import type { PlanProject, PlanRow } from '../../types'
import { isQuestionOpen, taskTotals } from './parse'

const tasksWith = (rows: PlanRow[], mark: string) =>
  rows.filter(row => row.kind === 'task' && row.status.startsWith(mark))
const openQuestions = (rows: PlanRow[]) => rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
const joined = (parts: (string | false)[]) => parts.filter(part => part !== false).join(' · ')

// Active: at least one task has started, and not every task is done.
export function isPlanActive(project: PlanProject) {
  const { done, total } = taskTotals(project.rows)
  const started = project.rows.some(row => row.kind === 'task' && !row.status.startsWith('⬜'))

  return started && done < total
}

// The lines under Flo on the plan list: how many plans, how many active, what is moving across all of them.
export function boardStatus(projects: PlanProject[]): string[] {
  if (projects.length === 0) return ['No plans yet.']
  const rows = projects.flatMap(project => project.rows)
  const inProgress = tasksWith(rows, '🔄').length
  const blocked = tasksWith(rows, '🚧').length
  const questions = openQuestions(rows).length
  const activity = joined([
    inProgress > 0 && plural(inProgress, 'task in progress', 'tasks in progress'),
    blocked > 0 && `${blocked} blocked`,
    questions > 0 && plural(questions, 'open question', 'open questions'),
  ])

  return [
    `${plural(projects.length, 'plan', 'plans')} · ${projects.filter(isPlanActive).length} active`,
    activity || 'Nothing in progress',
  ]
}

// The lines under Flo on a plan's page: which plan, its progress, and the task that matters now.
export function planStatus(project: PlanProject): string[] {
  const { done, total } = taskTotals(project.rows)
  const blocked = tasksWith(project.rows, '🚧')[0]
  const working = tasksWith(project.rows, '🔄')[0]
  const questions = openQuestions(project.rows).length
  const now = blocked
    ? `${blocked.id} blocked`
    : working
      ? `${working.id} in progress`
      : total > 0 && done === total
        ? 'all done'
        : 'nothing in progress'

  return [
    `Viewing '${project.name}' plan`,
    joined([`${done}/${total} tasks done`, now, questions > 0 && plural(questions, 'open question', 'open questions')]),
  ]
}
