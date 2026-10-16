import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import { deleteProject, loadBoard } from '../data/board'
import { Loading } from './components/Loading'
import { Mascot } from './components/Mascot'
import { PlanDetail } from './components/PlanDetail'
import { PlanList } from './components/PlanList'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)
const spinnerStep = atom({ plugin: 'taskflow', key: 'spinnerStep' } as const, 0)

// The container: reads the plugin's state, picks the view and hands the components what a press does.
export async function renderPane($: EngineInterface, e: RenderInput<'Pane'>) {
  const ui = $.ui.resolve(e)
  const { Box, Text } = ui
  const state = await read($, board)
  const selectedName = await read($, selected)
  const deleting = await read($, pendingDelete)
  const message = await read($, notice)

  if (state === null) return <Loading ui={ui} step={await read($, spinnerStep)} />
  if (state.projects.length === 0) {
    return (
      <Box flexDirection="column" gap={1}>
        <Mascot ui={ui} rows={[]} />
        <Text dimColor>No plans in {state.projectsDir}.</Text>
        {message && <Text color="warning">{message}</Text>}
      </Box>
    )
  }

  const project = state.projects.find(candidate => candidate.name === selectedName)
  if (project === undefined) {
    return (
      <PlanList
        ui={ui}
        projects={state.projects}
        message={message}
        onOpen={name => update($, selected, () => name)}
        onRefresh={() => loadBoard($)}
      />
    )
  }

  return (
    <PlanDetail
      ui={ui}
      board={state}
      project={project}
      isDeleting={deleting === project.name}
      message={message}
      onBack={() => update($, selected, () => null)}
      onNextTask={() => void $.prompt.submit({ text: '/taskflow:next-task' })}
      onRefresh={() => loadBoard($)}
      onAskDelete={() => update($, pendingDelete, () => project.name)}
      onConfirmDelete={() => deleteProject($, project.name)}
      onCancelDelete={() => update($, pendingDelete, () => null)}
    />
  )
}
