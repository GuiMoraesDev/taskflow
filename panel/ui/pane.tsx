import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import { deleteProject, loadBoard } from '../data/board'
import { mascotArt, mascotLine, mascotMood } from '../domain/mascot'
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

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        {mascotArt(mood).map((line, index) => (
          <Text key={index} color="claude">
            {line}
            {index === MASCOT_SPEECH_ROW && <Text dimColor> {mascotLine(mood, total - done)}</Text>}
          </Text>
        ))}
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
}
