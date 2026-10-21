import { ENV_KEYS, escapesVault, isEnvKey } from './plan-dir'
import type { WorkflowEnv } from './plan-dir'

export type PlanSourceSettings = {
  source: 'repo' | 'obsidian'
  vault?: string
  vaultPath?: string
  path?: string
}

function toEnv(settings: PlanSourceSettings): WorkflowEnv {
  const path = settings.path?.trim().replace(/\/+$/, '')
  const vaultPath = settings.vaultPath?.trim()

  return {
    TASKFLOW_PLANS_SOURCE: settings.source,
    TASKFLOW_OBSIDIAN_VAULT: vaultPath ? undefined : settings.vault?.trim() || undefined,
    TASKFLOW_OBSIDIAN_VAULT_PATH: vaultPath || undefined,
    TASKFLOW_OBSIDIAN_PATH: path || undefined,
  }
}

// Owned keys are rewritten in place or dropped when unset; every other line is kept as it was.
export function updateWorkflowEnv(
  existingText: string,
  settings: PlanSourceSettings,
): { text: string } | { error: string } {
  const env = toEnv(settings)
  if (Object.values(env).some(value => value !== undefined && /[\r\n]/.test(value))) {
    return { error: 'A setting cannot span more than one line.' }
  }
  const inner = env.TASKFLOW_OBSIDIAN_PATH ?? ''
  if (escapesVault(inner)) return { error: `The inner path "${inner}" must stay inside the vault.` }
  const vaultPath = env.TASKFLOW_OBSIDIAN_VAULT_PATH
  if (vaultPath && !vaultPath.startsWith('/')) return { error: `The vault path "${vaultPath}" must be absolute.` }

  const written = new Set<string>()
  const lines = existingText === '' ? [] : existingText.replace(/\n$/, '').split('\n')
  const kept = lines.flatMap(line => {
    const key = line.slice(0, line.indexOf('=')).trim()
    if (line.trim().startsWith('#') || !isEnvKey(key)) return [line]
    const value = env[key]
    if (value === undefined || written.has(key)) return []
    written.add(key)

    return [`${key}=${value}`]
  })
  const added = ENV_KEYS.flatMap(key => {
    const value = env[key]

    return value === undefined || written.has(key) ? [] : [`${key}=${value}`]
  })

  return { text: [...kept, ...added].map(line => `${line}\n`).join('') }
}
