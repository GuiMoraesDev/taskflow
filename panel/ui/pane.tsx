import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import { deleteProject, loadBoard } from '../data/board'
import { MASCOT_SPEECH_ROW, mascotArt, mascotLine, mascotMood } from '../domain/mascot'
import { activeTasks, isQuestionOpen, taskTotals } from '../domain/parse'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)

export async function renderPane($: EngineInterface, e: RenderInput<'Pane'>) {
  const { Box, Text, Button, Link } = $.ui.resolve(e)
  const state = await read($, board)
  const selectedName = await read($, selected)
  const deleting = await read($, pendingDelete)
  const message = await read($, notice)
  const progressBar = (done: number, total: number, width: number) => {
    const filled = total === 0 ? 0 : Math.round((done / total) * width)

    return (
      <Text>
        <Text color="success">{'█'.repeat(filled)}</Text>
        <Text dimColor>{'░'.repeat(width - filled)}</Text>
      </Text>
    )
  }

  if (state === null) return <Text dimColor>Loading…</Text>
  if (state.projects.length === 0) {
    return (
      <Box flexDirection="column">
        <Text dimColor>No plans in {state.projectsDir}.</Text>
        {message && <Text color="warning">{message}</Text>}
      </Box>
    )
  }

  const project = state.projects.find(candidate => candidate.name === selectedName)
  if (project === undefined) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text weight="bold">
          Plans <Text dimColor>{state.projects.length}</Text>
        </Text>
        {state.projects.slice(0, 9).map((candidate, index) => {
          const totals = taskTotals(candidate.rows)
          const working = candidate.rows.find(row => row.kind === 'task' && /^(🔄|🚧)/.test(row.status))
          const questions = candidate.rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status)).length
          const pullRequests = candidate.rows.filter(row => row.kind === 'pr')
          const opened = pullRequests.filter(row => row.prNumber !== null).length

          return (
            <Box key={`card-${candidate.name}`} flexDirection="column" borderStyle="round" paddingX={1}>
              <Button
                key={`open-${candidate.name}`}
                plain
                hotkey={String(index + 1)}
                onPress={() => update($, selected, () => candidate.name)}
              >
                <Text weight="bold">{candidate.title}</Text>
              </Button>
              <Text>
                {progressBar(totals.done, totals.total, 12)} <Text dimColor>{totals.done}/{totals.total} tasks</Text>
              </Text>
              <Text dimColor wrap="truncate-end">
                {working ? `${working.id} ${working.summary}` : totals.done === totals.total ? 'All tasks done' : 'Nothing in progress'}
              </Text>
              <Text dimColor>
                {opened}/{pullRequests.length} PRs opened
                {questions > 0 && <Text color="warning"> · {questions} open question(s)</Text>}
              </Text>
            </Box>
          )
        })}
        <Box gap={2}>
          <Button key="refresh" hotkey="r" label="[r] Refresh" onPress={() => loadBoard($)} />
        </Box>
        {message && <Text dimColor>{message}</Text>}
      </Box>
    )
  }

  const { done, total } = taskTotals(project.rows)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const active = activeTasks(project.rows)
  const pullRequests = project.rows.filter(row => row.kind === 'pr')
  const openedPullRequests = pullRequests.filter(row => row.prNumber !== null)
  const openQuestions = project.rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))
  const mood = mascotMood(project.rows)

  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" hotkey="b" label="[b] All plans" onPress={() => update($, selected, () => null)} />

      <Box flexDirection="column">
        {mascotArt(mood).map((cells, row) => (
          <Text key={`mascot-${row}`}>
            {cells.map(({ top, bottom }, column) =>
              top ? (
                <Text key={`px-${column}`} color={top} backgroundColor={bottom}>
                  ▀
                </Text>
              ) : bottom ? (
                <Text key={`px-${column}`} color={bottom}>
                  ▄
                </Text>
              ) : (
                ' '
              ),
            )}
            {row === MASCOT_SPEECH_ROW && <Text dimColor>  {mascotLine(mood, total - done)}</Text>}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column">
        <Text weight="bold" color="claude">
          {project.title}
        </Text>
        <Text>
          {progressBar(done, total, 20)} {done}/{total} tasks · {percent}%
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
        {pullRequests.map(row => {
          const worktree = row.branch === null ? undefined : state.worktrees[row.branch]

          return (
            <Box key={`pr-${row.id}`} flexDirection="column">
              <Text>
                <Text dimColor>{row.status}</Text>{' '}
                {row.prNumber !== null && state.repoUrl !== null ? (
                  <Link href={`${state.repoUrl}/pull/${row.prNumber}`} label={`#${row.prNumber}`} />
                ) : (
                  <Text weight="bold">{row.id}</Text>
                )}{' '}
                {row.summary.split(' · ')[0]}
              </Text>
              <Text dimColor wrap="truncate-end">
                {'  '}branch {row.branch ?? 'not named'} · worktree {worktree ?? 'not checked out'}
              </Text>
            </Box>
          )
        })}
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
}
