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

export type PlanSettings = {
  source: 'repo' | 'obsidian'
  vault: string | undefined
  vaultPath: string | undefined
  path: string | undefined
  vaults: { name: string; path: string }[]
  error: string | null
  repoName: string
}

export type SettingsDraft = {
  source: 'repo' | 'obsidian'
  vault: string
  vaultPath: string
  path: string
}

export type SessionWait = { dialog: boolean; permission: boolean; lastTurnAsked: boolean }

export type SettingsView = {
  current: PlanSettings
  draft: SettingsDraft
  saveError: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'taskflow': {
      board: PlanBoard | null
      selected: string | null
      pendingDelete: string | null
      notice: string | null
      trashEntries: TrashEntry[] | null
      pendingClear: boolean
      animationStep: number
      isMenuOpen: boolean
      tab: 'plans' | 'needs-you'
      settings: SettingsView | null
      waiting: SessionWait
    }
  }
}
