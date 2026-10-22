import type { PlanRow } from '../../types'

export type PullRequestGroup = { pr: PlanRow | null; tasks: PlanRow[]; done: number; total: number }
export type Segment = 'merged' | 'done' | 'progress' | 'pending'

const groupOf = (pr: PlanRow | null): PullRequestGroup => ({ pr, tasks: [], done: 0, total: 0 })

export function groupByPullRequest(rows: PlanRow[]): PullRequestGroup[] {
  const groups: PullRequestGroup[] = []

  for (const row of rows) {
    if (row.kind === 'pr') groups.push(groupOf(row))
    if (row.kind !== 'task') continue
    if (groups.length === 0) groups.push(groupOf(null))
    const group = groups[groups.length - 1]
    if (!group) continue
    group.tasks.push(row)
    group.total += 1
    if (row.status.startsWith('✅')) group.done += 1
  }

  return groups
}

const segment = (task: PlanRow): Segment => {
  if (task.status.startsWith('✅')) return 'done'

  return task.status.startsWith('🔄') ? 'progress' : 'pending'
}

export const prSegments = (rows: PlanRow[]): Segment[][] =>
  groupByPullRequest(rows).map(group =>
    group.tasks.map(task => (group.pr?.status.startsWith('✅') ? 'merged' : segment(task))),
  )
