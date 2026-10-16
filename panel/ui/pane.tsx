import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import type { PlanBoard, PlanProject } from '../../types'
import { deleteProject, loadBoard } from '../data/board'
import { Loading } from './components/molecules/Loading'
import { MascotHeader } from './components/organisms/MascotHeader'
import { PlanDetail } from './components/organisms/PlanDetail'
import { PlanList } from './components/organisms/PlanList'
import type { Ui } from './components/ui'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)
const animationStep = atom({ plugin: 'taskflow', key: 'animationStep' } as const, 0)
const mascotPreview = atom({ plugin: 'taskflow', key: 'mascotPreview' } as const, null)

// The container: reads the plugin's state, picks the view and hands the components what a press does.
export async function renderPane($: EngineInterface, e: RenderInput<'Pane'>) {
  const ui = $.ui.resolve(e)
  const { Box } = ui
  const state = await read($, board)
  const selectedName = await read($, selected)
  const deleting = await read($, pendingDelete)
  const message = await read($, notice)

  const step = await read($, animationStep)
  if (state === null) return <Loading ui={ui} step={step} />

  const project = state.projects.find(candidate => candidate.name === selectedName)
  const rows = project?.rows ?? state.projects.flatMap(candidate => candidate.rows)

  return (
    <Box flexDirection="column" gap={1}>
      <MascotHeader
        ui={ui}
        rows={rows}
        preview={await read($, mascotPreview)}
        step={step}
        onPreview={preview => update($, mascotPreview, () => preview)}
      />

      <PaneContent
        ui={ui}
        board={state}
        project={project}
        deleting={deleting}
        message={message}
        actions={{
          open: name => update($, selected, () => name),
          back: () => update($, selected, () => null),
          nextTask: () => void $.prompt.submit({ text: '/taskflow:next-task' }),
          refresh: () => loadBoard($),
          askDelete: name => update($, pendingDelete, () => name),
          confirmDelete: name => deleteProject($, name),
          cancelDelete: () => update($, pendingDelete, () => null),
        }}
      />
    </Box>
  )
}

// What a press does, built where `$` is: the engine refuses `$` passed as a prop.
type PaneActions = {
  open: (name: string) => void
  back: () => void
  nextTask: () => void
  refresh: () => void
  askDelete: (name: string) => void
  confirmDelete: (name: string) => void
  cancelDelete: () => void
}

type PaneContentProps = {
  ui: Ui
  board: PlanBoard
  project: PlanProject | undefined
  deleting: string | null
  message: string | null
  actions: PaneActions
}

// Picks the view under the header: no plans, the plan cards, or one plan's details.
const PaneContent = ({ ui, board: state, project, deleting, message, actions }: PaneContentProps) => {
  const { Box, Text } = ui

  return state.projects.length === 0 ? (
    <Box flexDirection="column">
      <Text dimColor>No plans in {state.projectsDir}.</Text>
      {message && <Text color="warning">{message}</Text>}
    </Box>
  ) : project === undefined ? (
    <PlanList ui={ui} projects={state.projects} message={message} onOpen={actions.open} onRefresh={actions.refresh} />
  ) : (
    <PlanDetail
      ui={ui}
      board={state}
      project={project}
      isDeleting={deleting === project.name}
      message={message}
      onBack={actions.back}
      onNextTask={actions.nextTask}
      onRefresh={actions.refresh}
      onAskDelete={() => actions.askDelete(project.name)}
      onConfirmDelete={() => actions.confirmDelete(project.name)}
      onCancelDelete={actions.cancelDelete}
    />
  )
}
