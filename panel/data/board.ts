import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { PlanBoard, PlanDir, PlanProject, TrashEntry } from '../../types'
import { isSafeProjectName, parseProgress, parseWorktrees, repoWebUrl } from '../domain/parse'
import { parseWorkflowEnv, resolvePlanDir } from '../domain/plan-dir'
import {
  TRASH_DIR,
  clearTargets,
  isDirectChild,
  isPlanFolder,
  parseTrashEntry,
  recoverDecision,
  trashEntryName,
} from '../domain/trash'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)
// null while the trash view is closed, so loadBoard only lists the trash when someone is looking at it.
const trashEntries = atom({ plugin: 'taskflow', key: 'trashEntries' } as const, null)
const pendingClear = atom({ plugin: 'taskflow', key: 'pendingClear' } as const, false)

export async function repoRoot($: EngineInterface) {
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

export async function readWorkflowEnv($: EngineInterface, root: string) {
  const path = `${root}/.claude/workflow.env`

  return parseWorkflowEnv((await $.fs.exists(path)) ? await $.fs.read(path) : '')
}

// null when obsidian.json is missing or unreadable, so the resolver can name that as the problem.
export async function readObsidianVaults($: EngineInterface) {
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

export async function readPlanDir($: EngineInterface, root: string) {
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
      if (entry.kind !== 'dir' || !isPlanFolder(entry.name)) continue
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
  if ((await read($, trashEntries)) !== null) {
    const listed = planDir === null ? [] : await listTrash($, planDir)
    await update($, trashEntries, () => listed)
  }

  const current = await read($, selected)
  if (!projects.some(project => project.name === current)) {
    await update($, selected, () => null)
  }
}

// A cheap fingerprint of what the board shows: the resolved plan dir and every PROGRESS.md's mtime.
export async function boardSignature($: EngineInterface) {
  const root = await repoRoot($)
  const resolved = await readPlanDir($, root)
  if ('error' in resolved) return `error:${resolved.error}`
  if (!(await $.fs.exists(resolved.base))) return `missing:${resolved.base}`

  const stamps: string[] = [resolved.base]
  for (const entry of await $.fs.list(resolved.base)) {
    if (entry.kind !== 'dir') continue
    const progressPath = `${resolved.base}/${entry.name}/PROGRESS.md`
    if (!(await $.fs.exists(progressPath))) continue
    stamps.push(`${entry.name}:${(await $.fs.stat(progressPath)).mtimeMs}`)
  }

  return stamps.join('|')
}

async function realPath($: EngineInterface, path: string) {
  const resolved = await $.process.run(['realpath', '--', path])

  return resolved.exitCode === 0 ? resolved.stdout.trim() : null
}

// Both sides resolved, so a symlinked plan or base cannot point a move or removal outside the base.
async function isContained($: EngineInterface, base: string, target: string) {
  const [realBase, realTarget] = [await realPath($, base), await realPath($, target)]

  return realBase !== null && realTarget !== null && isDirectChild(realBase, realTarget)
}

async function finish($: EngineInterface, message: string) {
  await update($, pendingClear, () => false)
  await update($, notice, () => message)
  await loadBoard($)
}

async function currentPlanDir($: EngineInterface) {
  return (await read($, board))?.planDir ?? null
}

export async function deleteProject($: EngineInterface, name: string) {
  const current = await read($, board)
  const isKnown = current?.projects.some(project => project.name === name) ?? false
  const planDir = current?.planDir ?? null
  await update($, pendingDelete, () => null)
  if (planDir === null || !isKnown || !isSafeProjectName(name)) {
    await update($, notice, () => `Refused to delete "${name}".`)
    return
  }

  const target = `${planDir.base}/${name}`
  if (!(await isContained($, planDir.base, target))) {
    await update($, notice, () => `Refused to delete "${name}": it is not a plan folder inside ${planDir.label}.`)
    return
  }

  const trash = `${planDir.base}/${TRASH_DIR}`
  const made = await $.process.run(['mkdir', '-p', '--', trash])
  const destination = `${trash}/${trashEntryName(name, new Date())}`
  // -n: never overwrite an entry trashed in the same second.
  const moved =
    made.exitCode === 0 && !(await $.fs.exists(destination))
      ? await $.process.run(['mv', '-n', '--', target, destination])
      : null
  await update($, selected, () => null)
  await finish(
    $,
    moved?.exitCode === 0
      ? `Moved ${planDir.label}/${name} to the trash`
      : `Delete failed: ${moved?.stderr.trim() || made.stderr.trim() || 'the trash entry already exists'}`,
  )
}

export async function listTrash($: EngineInterface, planDir: PlanDir): Promise<TrashEntry[]> {
  const trash = `${planDir.base}/${TRASH_DIR}`
  if (!(await $.fs.exists(trash))) return []
  const entries = (await $.fs.list(trash)).flatMap(entry => {
    const parsed = entry.kind === 'dir' ? parseTrashEntry(entry.name) : null

    return parsed === null ? [] : [parsed]
  })

  return entries.sort((first, second) => second.deletedAt - first.deletedAt)
}

export async function recoverPlan($: EngineInterface, entry: string) {
  const planDir = await currentPlanDir($)
  if (planDir === null) return finish($, `Refused to recover "${entry}".`)
  const trash = `${planDir.base}/${TRASH_DIR}`
  const existing = (await $.fs.list(planDir.base)).map(item => item.name)
  const decision = recoverDecision(entry, existing)
  if ('error' in decision) return finish($, decision.error)

  const source = `${trash}/${entry}`
  if (!(await isContained($, trash, source))) return finish($, `Refused to recover "${entry}".`)
  const moved = await $.process.run(['mv', '-n', '--', source, `${planDir.base}/${decision.name}`])
  await finish(
    $,
    moved.exitCode === 0 && !(await $.fs.exists(source))
      ? `Recovered ${planDir.label}/${decision.name}`
      : `Recover failed: ${moved.stderr.trim() || `"${decision.name}" already exists`}`,
  )
}

// The only permanent delete left: each child of .trash is checked on its real path before removal.
export async function clearTrash($: EngineInterface) {
  const planDir = await currentPlanDir($)
  const trash = planDir === null ? null : `${planDir.base}/${TRASH_DIR}`
  if (planDir === null || trash === null || !(await $.fs.exists(trash))) return finish($, 'The trash is empty.')
  if (!(await isContained($, planDir.base, trash))) return finish($, 'Refused to clear the trash.')

  const names = (await $.fs.list(trash)).map(item => item.name)
  const targets: string[] = []
  for (const target of clearTargets(planDir.base, names)) {
    if (await isContained($, trash, target)) targets.push(target)
  }
  if (targets.length === 0) return finish($, 'The trash is empty.')
  const removal = await $.process.run(['rm', '-rf', '--', ...targets])
  await finish($, removal.exitCode === 0 ? 'Cleared the trash.' : `Clear failed: ${removal.stderr.trim()}`)
}

export async function openTrash($: EngineInterface) {
  await update($, notice, () => null)
  await update($, trashEntries, () => [])
  await loadBoard($)
}

export async function closeTrash($: EngineInterface) {
  await update($, pendingClear, () => false)
  await update($, trashEntries, () => null)
}
