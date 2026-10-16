import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { PlanBoard, PlanProject } from '../../types'
import { isSafeProjectName, parseProgress, repoWebUrl } from '../domain/parse'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)

const DEFAULT_PROJECTS_DIR = '.planning/projects'

async function repoRoot($: EngineInterface) {
  const toplevel = await $.process.run(['git', 'rev-parse', '--show-toplevel'])

  return toplevel.exitCode === 0 ? toplevel.stdout.trim() : await $.session.cwd()
}

async function readProjectsDir($: EngineInterface, root: string) {
  try {
    const config = JSON.parse(await $.fs.read(`${root}/.claude/workflow.json`))

    return typeof config.projectsDir === 'string' ? config.projectsDir : DEFAULT_PROJECTS_DIR
  } catch {
    return DEFAULT_PROJECTS_DIR
  }
}

export async function loadBoard($: EngineInterface) {
  const root = await repoRoot($)
  const projectsDir = await readProjectsDir($, root)
  const projectsPath = `${root}/${projectsDir}`
  const remote = await $.process.run(['git', 'remote', 'get-url', 'origin'], { cwd: root })
  const repoUrl = remote.exitCode === 0 ? repoWebUrl(remote.stdout) : null

  const projects: PlanProject[] = []
  if (await $.fs.exists(projectsPath)) {
    for (const entry of await $.fs.list(projectsPath)) {
      if (entry.kind !== 'dir') continue
      const progressPath = `${projectsPath}/${entry.name}/PROGRESS.md`
      if (!(await $.fs.exists(progressPath))) continue
      const { title, rows } = parseProgress(await $.fs.read(progressPath))
      const { mtimeMs } = await $.fs.stat(progressPath)
      projects.push({ name: entry.name, title: title || entry.name, rows, updatedAt: mtimeMs })
    }
  }
  projects.sort((first, second) => second.updatedAt - first.updatedAt)

  const next: PlanBoard = { projectsDir, repoUrl, projects }
  await update($, board, () => next)

  const current = await read($, selected)
  if (!projects.some(project => project.name === current)) {
    await update($, selected, () => projects[0]?.name ?? null)
  }
}

export async function deleteProject($: EngineInterface, name: string) {
  const current = await read($, board)
  const isKnown = current?.projects.some(project => project.name === name) ?? false
  if (current === null || !isKnown || !isSafeProjectName(name)) {
    await update($, notice, () => `Refused to delete "${name}".`)
    return
  }

  const target = `${await repoRoot($)}/${current.projectsDir}/${name}`
  const removal = await $.process.run(['rm', '-rf', '--', target])
  await update($, pendingDelete, () => null)
  await update($, notice, () =>
    removal.exitCode === 0 ? `Deleted ${current.projectsDir}/${name}` : `Delete failed: ${removal.stderr.trim()}`,
  )
  await update($, selected, () => null)
  await loadBoard($)
}
