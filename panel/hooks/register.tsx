import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { PlanBoard, PlanProject } from '../types'
import { mascotArt, mascotLine, mascotMood } from './mascot'
import { activeTasks, isQuestionOpen, isSafeProjectName, parseProgress, repoWebUrl, taskTotals } from './parse'

const PANE = 'taskflow-panel'
const TITLE = 'Taskflow'
const DEFAULT_PROJECTS_DIR = '.planning/projects'

const board = atom({ plugin: 'taskflow-panel', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow-panel', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow-panel', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow-panel', key: 'notice' } as const, null)

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

async function loadBoard($: EngineInterface) {
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

async function deleteProject($: EngineInterface, name: string) {
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

async function openPane($: EngineInterface, focus = false) {
  await $.ui.open({ id: PANE, title: TITLE, columns: 60, ...(focus ? { focus: true as const } : {}) })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'taskflow', description: 'Open the Taskflow pane: plans, tasks, PRs' })
    void loadBoard($)
    void openPane($)

    return next(e)
  })

  on('command.run', { command: 'taskflow' }, async $ => {
    await loadBoard($)
    await openPane($, true)

    return { text: 'Taskflow pane opened.' }
  })

  on('turn.complete', async ($, e, next) => {
    void loadBoard($)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const state = await read($, board)
    const selectedName = await read($, selected)
    const deleting = await read($, pendingDelete)
    const message = await read($, notice)

    if (state === null) return <Text dimColor>Loading…</Text>
    if (state.projects.length === 0) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No plans in {state.projectsDir}.</Text>
          {message && <Text color="warning">{message}</Text>}
        </Box>
      )
    }

    const project = state.projects.find(candidate => candidate.name === selectedName) ?? state.projects[0]
    if (project === undefined) return <Text dimColor>No plans.</Text>
    const { done, total } = taskTotals(project.rows)
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    const barWidth = 20
    const filled = Math.round((percent / 100) * barWidth)
    const active = activeTasks(project.rows)
    const pullRequests = project.rows.filter(row => row.kind === 'pr')
    const openedPullRequests = pullRequests.filter(row => row.prNumber !== null)
    const openQuestions = project.rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))
    const mood = mascotMood(project.rows)
    const [ears, face, body] = mascotArt(mood)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text color="claude">{ears}</Text>
          <Text color="claude">
            {face} <Text dimColor>{mascotLine(mood, total - done)}</Text>
          </Text>
          <Text color="claude">{body}</Text>
        </Box>

        <Box flexDirection="column">
          <Text weight="bold">Plans</Text>
          {state.projects.slice(0, 9).map((candidate, index) => {
            const totals = taskTotals(candidate.rows)
            const isCurrent = candidate.name === project.name

            return (
              <Button
                key={`project-${candidate.name}`}
                hotkey={String(index + 1)}
                onPress={() => update($, selected, () => candidate.name)}
              >
                <Text color={isCurrent ? 'claude' : undefined} weight={isCurrent ? 'bold' : undefined}>
                  {isCurrent ? '▸' : ' '} [{index + 1}] {candidate.name}
                </Text>{' '}
                <Text dimColor>
                  {totals.done}/{totals.total}
                </Text>
              </Button>
            )
          })}
        </Box>

        <Box flexDirection="column">
          <Text weight="bold" color="claude">
            {project.title}
          </Text>
          <Text>
            <Text color="success">{'█'.repeat(filled)}</Text>
            <Text dimColor>{'░'.repeat(barWidth - filled)}</Text> {done}/{total} tasks · {percent}%
          </Text>
        </Box>

        <Box flexDirection="column">
          <Text weight="bold">Active tasks</Text>
          {active.length === 0 && <Text color="success">Nothing left to do.</Text>}
          {active.map(row => (
            <Text>
              <Text color={row.status.startsWith('🔄') ? 'warning' : row.status.startsWith('🚧') ? 'error' : 'subtle'}>
                {row.status.split(' ').slice(0, 2).join(' ')}
              </Text>{' '}
              <Text weight="bold">{row.id}</Text> <Text dimColor>{row.owner}</Text>
              {'\n  '}
              {row.summary}
            </Text>
          ))}
          {openQuestions.length > 0 && (
            <Text color="warning">
              {openQuestions.length} open question(s): {openQuestions.map(row => row.id).join(', ')}
            </Text>
          )}
        </Box>

        <Box flexDirection="column">
          <Text weight="bold">
            Pull requests <Text color="suggestion">{openedPullRequests.length}</Text>
            <Text dimColor> created of {pullRequests.length}</Text>
          </Text>
          {pullRequests.map(row => (
            <Text>
              <Text dimColor>{row.status}</Text>{' '}
              {row.prNumber !== null && state.repoUrl !== null ? (
                <Link href={`${state.repoUrl}/pull/${row.prNumber}`} label={`#${row.prNumber}`} />
              ) : (
                <Text weight="bold">{row.id}</Text>
              )}{' '}
              {row.summary.split(' · ')[0]}
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          {deleting === project.name ? (
            <Box flexDirection="column">
              <Text color="error" weight="bold">
                Delete {state.projectsDir}/{project.name}? This cannot be undone.
              </Text>
              <Box gap={2}>
                <Button key="confirm-delete" hotkey="y" label="[y] Yes, delete" onPress={() => deleteProject($, project.name)} />
                <Button key="cancel-delete" hotkey="n" label="[n] Cancel" onPress={() => update($, pendingDelete, () => null)} />
              </Box>
            </Box>
          ) : (
            <Box gap={2}>
              <Button key="next-task" hotkey="t" label="[t] Next task" onPress={() => void $.prompt.submit({ text: '/taskflow:next-task' })} />
              <Button key="refresh" hotkey="r" label="[r] Refresh" onPress={() => loadBoard($)} />
              <Button
                key="delete"
                hotkey="x"
                label="[x] Delete workspace"
                onPress={() => update($, pendingDelete, () => project.name)}
              />
            </Box>
          )}
          {message && <Text dimColor>{message}</Text>}
        </Box>
      </Box>
    )
  })
}
