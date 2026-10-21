export type RowKind = 'task' | 'question' | 'pr'

export type PlanRow = {
  id: string
  kind: RowKind
  status: string
  owner: string
  summary: string
  prNumber: number | null
  branch: string | null
}

export type PlanProject = {
  name: string
  title: string
  rows: PlanRow[]
  updatedAt: number
}

export type PlanDir = {
  base: string
  label: string
}

export type TrashEntry = {
  entry: string
  name: string
  deletedAt: number
}

export type PlanBoard = {
  planDir: PlanDir | null
  planDirError: string | null
  repoUrl: string | null
  worktrees: Record<string, string>
  projects: PlanProject[]
}

declare module 'claude-code' {
  interface PluginState {
    'taskflow': {
      board: PlanBoard | null
      selected: string | null
      pendingDelete: string | null
      notice: string | null
      animationStep: number
      isMenuOpen: boolean
    }
  }
}
