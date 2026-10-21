import type { PlanDir } from '../../types'

export const ENV_KEYS = [
  'TASKFLOW_PLANS_SOURCE',
  'TASKFLOW_OBSIDIAN_VAULT',
  'TASKFLOW_OBSIDIAN_VAULT_PATH',
  'TASKFLOW_OBSIDIAN_PATH',
] as const

export type WorkflowEnv = Partial<Record<(typeof ENV_KEYS)[number], string>>

export const DEFAULT_PROJECTS_DIR = 'docs/projects'

export const isEnvKey = (key: string): key is (typeof ENV_KEYS)[number] => ENV_KEYS.some(allowed => allowed === key)

export const basename = (path: string) => path.replace(/\/+$/, '').split('/').pop() ?? ''

export const escapesVault = (inner: string) => inner.startsWith('/') || inner.split('/').includes('..')

// workflow.env is untracked, so only the keys that pick the plan source are read - never gates or models.
export function parseWorkflowEnv(text: string): WorkflowEnv {
  const env: WorkflowEnv = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    const separator = trimmed.indexOf('=')
    if (trimmed.startsWith('#') || separator < 1) continue
    const key = trimmed.slice(0, separator).trim()
    if (isEnvKey(key)) env[key] = trimmed.slice(separator + 1).trim()
  }

  return env
}

function vaultPath(env: WorkflowEnv, obsidianVaults: string[] | null): { path: string } | { error: string } {
  const explicit = env.TASKFLOW_OBSIDIAN_VAULT_PATH
  if (explicit) {
    return explicit.startsWith('/') ? { path: explicit } : { error: 'TASKFLOW_OBSIDIAN_VAULT_PATH must be absolute.' }
  }

  const name = env.TASKFLOW_OBSIDIAN_VAULT
  if (!name) return { error: 'Set TASKFLOW_OBSIDIAN_VAULT or TASKFLOW_OBSIDIAN_VAULT_PATH in .claude/workflow.env.' }
  if (obsidianVaults === null) return { error: 'Cannot read Obsidian’s obsidian.json to find the vault.' }

  const matches = obsidianVaults.filter(path => basename(path) === name)
  if (matches.length === 0) return { error: `No Obsidian vault named "${name}".` }
  if (matches.length > 1) {
    return { error: `${matches.length} Obsidian vaults are named "${name}" - set TASKFLOW_OBSIDIAN_VAULT_PATH.` }
  }

  return { path: matches[0] ?? '' }
}

// With Obsidian as the source a problem is an error, never a fallback: the repo folder may hold other plans.
export function resolvePlanDir(input: {
  projectsDir: string | null
  env: WorkflowEnv
  obsidianVaults: string[] | null
  repoRoot: string
}): PlanDir | { error: string } {
  const { env, repoRoot } = input
  if (env.TASKFLOW_PLANS_SOURCE !== 'obsidian') {
    const projectsDir = input.projectsDir ?? DEFAULT_PROJECTS_DIR

    return { base: `${repoRoot}/${projectsDir}`, label: projectsDir }
  }

  const inner = (env.TASKFLOW_OBSIDIAN_PATH ?? '').replace(/\/+$/, '')
  if (escapesVault(inner)) {
    return { error: `TASKFLOW_OBSIDIAN_PATH "${inner}" must stay inside the vault.` }
  }

  const vault = vaultPath(env, input.obsidianVaults)
  if ('error' in vault) return vault
  const root = vault.path.replace(/\/+$/, '')
  const shown = inner ? `${basename(root)}/${inner}` : basename(root)

  return { base: inner ? `${root}/${inner}` : root, label: `Obsidian · ${shown}` }
}
