import type { EngineInterface } from 'claude-code'

import { basename } from '../domain/plan-dir'
import { updateWorkflowEnv } from '../domain/workflow-env'
import type { PlanSourceSettings } from '../domain/workflow-env'
import { loadBoard, readObsidianVaults, readPlanDir, readWorkflowEnv, repoRoot } from './board'

export async function loadSettings($: EngineInterface) {
  const root = await repoRoot($)
  const env = await readWorkflowEnv($, root)
  const resolved = await readPlanDir($, root)
  const vaults = (await readObsidianVaults($))?.map(path => ({ name: basename(path), path })) ?? []

  return {
    source: env.TASKFLOW_PLANS_SOURCE === 'obsidian' ? 'obsidian' : 'repo',
    vault: env.TASKFLOW_OBSIDIAN_VAULT,
    vaultPath: env.TASKFLOW_OBSIDIAN_VAULT_PATH,
    path: env.TASKFLOW_OBSIDIAN_PATH,
    vaults,
    error: 'error' in resolved ? resolved.error : null,
  } as const
}

// workflow.env holds machine paths, so .claude/.gitignore must list it before the file is written.
async function ensureIgnored($: EngineInterface, root: string) {
  const path = `${root}/.claude/.gitignore`
  const current = (await $.fs.exists(path)) ? await $.fs.read(path) : ''
  if (current.split('\n').some(line => line.trim() === 'workflow.env')) return
  const separator = current === '' || current.endsWith('\n') ? '' : '\n'
  await $.fs.write(path, `${current}${separator}workflow.env\n`)
}

export async function saveSettings($: EngineInterface, settings: PlanSourceSettings) {
  const root = await repoRoot($)
  const path = `${root}/.claude/workflow.env`
  const updated = updateWorkflowEnv((await $.fs.exists(path)) ? await $.fs.read(path) : '', settings)
  if ('error' in updated) return updated
  await ensureIgnored($, root)
  await $.fs.write(path, updated.text)
  await loadBoard($)

  return { error: null }
}
