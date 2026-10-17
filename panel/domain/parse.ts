import type { PlanRow, RowKind } from '../../types'

const SEPARATOR_CELL = /^:?-+:?$/

function rowKind(id: string, category: string): RowKind | null {
  if (/^TASK-\d+/i.test(id)) return 'task'
  if (/^Q\d+/i.test(id)) return 'question'
  if (/^PR-\d+/i.test(id) || /^#\d+/.test(id) || category.includes('🔀')) return 'pr'

  return null
}

export function parseProgress(markdown: string): { title: string; rows: PlanRow[] } {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1] ?? ''
  const title = heading.replace(/^Progress\s+[—-]\s+/, '').trim()
  const rows: PlanRow[] = []

  for (const line of markdown.split('\n')) {
    if (!line.trim().startsWith('|')) continue
    const cells = line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map(cell => cell.trim())
    if (cells.length < 5 || cells.every(cell => SEPARATOR_CELL.test(cell)) || cells[1] === 'ID') continue

    const [status = '', id = '', category = '', owner = '', ...summaryCells] = cells
    const kind = rowKind(id, category)
    if (kind === null) continue

    const prMatch = kind === 'pr' ? `${id} ${status}`.match(/#(\d+)/) : null
    const branchMatch = kind === 'pr' ? summaryCells.join(' | ').match(/`([^`]+)`/) : null
    rows.push({
      id,
      kind,
      status,
      owner,
      summary: summaryCells.join(' | ').replace(/`/g, ''),
      prNumber: prMatch ? Number(prMatch[1]) : null,
      branch: branchMatch?.[1] ?? null,
    })
  }

  return { title, rows }
}

export function isTaskDone(status: string) {
  return status.startsWith('✅') || status.startsWith('❌')
}

export function isQuestionOpen(status: string) {
  return !status.startsWith('✅') && !status.startsWith('❌')
}

export function openQuestions(rows: PlanRow[]) {
  return rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))
}

export function taskTotals(rows: PlanRow[]) {
  const tasks = rows.filter(row => row.kind === 'task')

  return { done: tasks.filter(row => isTaskDone(row.status)).length, total: tasks.length }
}

export function activeTasks(rows: PlanRow[], pendingLimit = 3) {
  const tasks = rows.filter(row => row.kind === 'task')
  const working = tasks.filter(row => /^(🔄|🚧|⚠️)/.test(row.status))
  const pending = tasks.filter(row => row.status.startsWith('⬜')).slice(0, pendingLimit)

  return [...working, ...pending]
}

export function repoWebUrl(remote: string): string | null {
  const match = remote.trim().match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/)

  return match ? `https://github.com/${match[1]}/${match[2]}` : null
}

export function isSafeProjectName(name: string) {
  return /^[\w.-]+$/.test(name) && name !== '.' && name !== '..'
}

export function parseWorktrees(porcelain: string): Record<string, string> {
  const worktrees: Record<string, string> = {}
  for (const block of porcelain.split('\n\n')) {
    const path = block.match(/^worktree (.+)$/m)?.[1]
    const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1]
    if (path && branch) worktrees[branch] = path
  }

  return worktrees
}
