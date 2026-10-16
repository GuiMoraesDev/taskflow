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

export type PlanBoard = {
  projectsDir: string
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
    }
  }
}
