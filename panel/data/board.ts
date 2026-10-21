import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { PlanBoard, PlanProject } from '../../types'
import { isSafeProjectName, parseProgress, parseWorktrees, repoWebUrl } from '../domain/parse'
import { parseWorkflowEnv, resolvePlanDir } from '../domain/plan-dir'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)

async function repoRoot($: EngineInterface) {
  const toplevel = await $.process.run(['git', 'rev-parse', '--show-toplevel'])

  return toplevel.exitCode === 0 ? toplevel.stdout.trim() : await $.session.cwd()
}

async function readProjectsDir($: EngineInterface, root: string) {
  try {
    const config = JSON.parse(await $.fs.read(`${root}/.claude/workflow.json`))

    return typeof config.projectsDir === 'string' ? config.projectsDir : null
  } catch {
    return null
  }
}

async function readWorkflowEnv($: EngineInterface, root: string) {
  const path = `${root}/.claude/workflow.env`

  return parseWorkflowEnv((await $.fs.exists(path)) ? await $.fs.read(path) : '')
}

// null when obsidian.json is missing or unreadable, so the resolver can name that as the problem.
async function readObsidianVaults($: EngineInterface) {
  const home = await $.process.run(['printenv', 'HOME'])
  if (home.exitCode !== 0) return null
  try {
    const config = JSON.parse(
      await $.fs.read(`${home.stdout.trim()}/Library/Application Support/obsidian/obsidian.json`),
    )
    const vaults: unknown[] = Object.values(config.vaults ?? {})

    return vaults.flatMap(vault =>
      typeof vault === 'object' && vault !== null && 'path' in vault && typeof vault.path === 'string'
        ? [vault.path]
        : [],
    )
  } catch {
    return null
  }
}

async function readPlanDir($: EngineInterface, root: string) {
  const env = await readWorkflowEnv($, root)
  const needsVaults = env.TASKFLOW_PLANS_SOURCE === 'obsidian' && !env.TASKFLOW_OBSIDIAN_VAULT_PATH

  return resolvePlanDir({
    projectsDir: await readProjectsDir($, root),
    env,
    obsidianVaults: needsVaults ? await readObsidianVaults($) : null,
    repoRoot: root,
  })
}

export async function loadBoard($: EngineInterface) {
  const root = await repoRoot($)
  const resolved = await readPlanDir($, root)
  const planDir = 'error' in resolved ? null : resolved
  const remote = await $.process.run(['git', 'remote', 'get-url', 'origin'], { cwd: root })
  const repoUrl = remote.exitCode === 0 ? repoWebUrl(remote.stdout) : null
  const worktreeList = await $.process.run(['git', 'worktree', 'list', '--porcelain'], { cwd: root })
  const worktrees = worktreeList.exitCode === 0 ? parseWorktrees(worktreeList.stdout) : {}

  const projects: PlanProject[] = []
  if (planDir !== null && (await $.fs.exists(planDir.base))) {
    for (const entry of await $.fs.list(planDir.base)) {
      if (entry.kind !== 'dir') continue
      const progressPath = `${planDir.base}/${entry.name}/PROGRESS.md`
      if (!(await $.fs.exists(progressPath))) continue
      const { title, rows } = parseProgress(await $.fs.read(progressPath))
      const { mtimeMs } = await $.fs.stat(progressPath)
      projects.push({ name: entry.name, title: title || entry.name, rows, updatedAt: mtimeMs })
    }
  }
  projects.sort((first, second) => second.updatedAt - first.updatedAt)

  const planDirError = 'error' in resolved ? resolved.error : null
  const next: PlanBoard = { planDir, planDirError, repoUrl, worktrees, projects }
  await update($, board, () => next)

  const current = await read($, selected)
  if (!projects.some(project => project.name === current)) {
    await update($, selected, () => null)
  }
}

export async function deleteProject($: EngineInterface, name: string) {
  const current = await read($, board)
  const isKnown = current?.projects.some(project => project.name === name) ?? false
  const planDir = current?.planDir ?? null
  if (planDir === null || !isKnown || !isSafeProjectName(name)) {
    await update($, notice, () => `Refused to delete "${name}".`)
    return
  }

  const target = `${planDir.base}/${name}`
  const removal = await $.process.run(['rm', '-rf', '--', target])
  await update($, pendingDelete, () => null)
  await update($, notice, () =>
    removal.exitCode === 0 ? `Deleted ${planDir.label}/${name}` : `Delete failed: ${removal.stderr.trim()}`,
  )
  await update($, selected, () => null)
  await loadBoard($)
}
