import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import type { PlanBoard, PlanProject } from '../../types'
import { deleteProject, loadBoard } from '../data/board'
import { boardStatus, planStatus } from '../domain/status'
import { Loading } from './components/molecules/Loading'
import { Mascot } from './components/molecules/Mascot'
import { PlanDetail } from './components/organisms/PlanDetail'
import { PlanList } from './components/organisms/PlanList'
import type { Ui } from './components/ui'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)
const animationStep = atom({ plugin: 'taskflow', key: 'animationStep' } as const, 0)
const isMenuOpen = atom({ plugin: 'taskflow', key: 'isMenuOpen' } as const, false)

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
    <Box flexDirection="column" gap={1} minHeight={e.props.scroll.bodyRows}>
      <Mascot ui={ui} rows={rows} status={project ? planStatus(project) : boardStatus(state.projects)} step={step} />

      <PaneContent
        ui={ui}
        board={state}
        project={project}
        deleting={deleting}
        isMenuOpen={await read($, isMenuOpen)}
        message={message}
        actions={{
          open: name => update($, selected, () => name),
          back: () => {
            void update($, isMenuOpen, () => false)
            void update($, selected, () => null)
          },
          toggleMenu: () => update($, isMenuOpen, open => !open),
          nextTask: () => void $.prompt.submit({ text: '/taskflow:next-task' }),
          refresh: () => {
            void update($, isMenuOpen, () => false)
            void loadBoard($)
          },
          askDelete: name => {
            void update($, isMenuOpen, () => false)
            void update($, pendingDelete, () => name)
          },
          confirmDelete: name => deleteProject($, name),
          cancelDelete: () => update($, pendingDelete, () => null),
        }}
      />
    </Box>
  )
}

type PaneActions = {
  open: (name: string) => void
  back: () => void
  toggleMenu: () => void
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
  isMenuOpen: boolean
  message: string | null
  actions: PaneActions
}

const PaneContent = ({ ui, board: state, project, deleting, isMenuOpen, message, actions }: PaneContentProps) => {
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
      isMenuOpen={isMenuOpen}
      message={message}
      onBack={actions.back}
      onToggleMenu={actions.toggleMenu}
      onNextTask={actions.nextTask}
      onRefresh={actions.refresh}
      onAskDelete={() => actions.askDelete(project.name)}
      onConfirmDelete={() => actions.confirmDelete(project.name)}
      onCancelDelete={actions.cancelDelete}
    />
  )
}
