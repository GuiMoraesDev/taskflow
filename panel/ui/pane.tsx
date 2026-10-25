import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput } from 'claude-code'

import type { PlanBoard, PlanProject, TrashEntry } from '../../types'
import { clearTrash, closeTrash, deleteProject, loadBoard, openTrash, recoverPlan } from '../data/board'
import { closeSettings, editSettings, openSettings, submitSettings } from '../data/settings'
import { boardNeedsYou } from '../domain/attention'
import { boardStatus, planStatus } from '../domain/status'
import { Loading } from './components/molecules/Loading'
import { Mascot } from './components/molecules/Mascot'
import { MenuSheet } from './components/molecules/MenuSheet'
import { NeedsYouCard } from './components/molecules/NeedsYouCard'
import { TabBar, type Tab } from './components/molecules/TabBar'
import { ObsidianSettings } from './components/organisms/ObsidianSettings'
import { PlanDetail } from './components/organisms/PlanDetail'
import { PlanList } from './components/organisms/PlanList'
import { TrashView } from './components/organisms/TrashView'
import type { Ui } from './components/ui'

const board = atom({ plugin: 'taskflow', key: 'board' } as const, null)
const selected = atom({ plugin: 'taskflow', key: 'selected' } as const, null)
const pendingDelete = atom({ plugin: 'taskflow', key: 'pendingDelete' } as const, null)
const notice = atom({ plugin: 'taskflow', key: 'notice' } as const, null)
const trashEntries = atom({ plugin: 'taskflow', key: 'trashEntries' } as const, null)
const pendingClear = atom({ plugin: 'taskflow', key: 'pendingClear' } as const, false)
const animationStep = atom({ plugin: 'taskflow', key: 'animationStep' } as const, 0)
const isMenuOpen = atom({ plugin: 'taskflow', key: 'isMenuOpen' } as const, false)
const waiting = atom({ plugin: 'taskflow', key: 'waiting' } as const, {
  dialog: false,
  permission: false,
  lastTurnAsked: false,
})
const tab = atom({ plugin: 'taskflow', key: 'tab' } as const, 'plans')
const settings = atom({ plugin: 'taskflow', key: 'settings' } as const, null)

export async function renderPane($: EngineInterface, e: RenderInput<'Pane'>) {
  const ui = $.ui.resolve(e)
  const { Box } = ui
  const state = await read($, board)
  const selectedName = await read($, selected)
  const deleting = await read($, pendingDelete)
  const message = await read($, notice)

  const step = await read($, animationStep)
  if (state === null) return <Loading ui={ui} step={step} />

  const settingsView = await read($, settings)
  if (settingsView !== null) {
    return (
      <Box flexDirection="column" gap={1} minHeight={e.props.scroll.bodyRows}>
        <ObsidianSettings
          ui={ui}
          view={settingsView}
          onBack={() => void closeSettings($)}
          onChange={change => void editSettings($, change)}
          onSave={() => void submitSettings($, settingsView.draft)}
        />
      </Box>
    )
  }

  const activeTab = await read($, tab)
  const found = state.projects.find(candidate => candidate.name === selectedName)
  const project = activeTab === 'needs-you' ? undefined : found
  const trashList = await read($, trashEntries)
  const hasBar = trashList === null && state.projects.length > 0
  const back = () => {
    void update($, isMenuOpen, () => false)
    void update($, tab, () => 'plans')
    void update($, selected, () => null)
  }
  const menuOpen = await read($, isMenuOpen)
  const hasSheet = menuOpen && hasBar && activeTab === 'plans'
  const wait = await read($, waiting)
  const rows = project?.rows ?? state.projects.flatMap(candidate => candidate.rows)

  return (
    <Box flexDirection="column" gap={1} minHeight={e.props.scroll.bodyRows}>
      <Mascot
        ui={ui}
        rows={rows}
        status={project ? planStatus(project) : boardStatus(state.projects)}
        step={step}
        waiting={wait.dialog || wait.permission || wait.lastTurnAsked}
        card={state.projects.length > 0}
      />

      <PaneContent
        ui={ui}
        board={state}
        columns={e.props.bodyColumns}
        project={project}
        deleting={deleting}
        trash={trashList}
        tab={activeTab}
        isClearing={await read($, pendingClear)}
        isMenuOpen={menuOpen}
        message={message}
        actions={{
          open: name => {
            void update($, isMenuOpen, () => false)
            void update($, tab, () => 'plans')
            void update($, selected, () => name)
          },
          back,
          toggleMenu: () => update($, isMenuOpen, open => !open),
          nextTask: () => void $.prompt.submit({ text: '/taskflow:next-task' }),
          openSettings: () => void openSettings($),
          confirmDelete: name => deleteProject($, name),
          cancelDelete: () => update($, pendingDelete, () => null),
          openTrash: () => openTrash($),
          closeTrash: () => closeTrash($),
          recover: entry => recoverPlan($, entry),
          askClear: () => update($, pendingClear, () => true),
          confirmClear: () => clearTrash($),
          cancelClear: () => update($, pendingClear, () => false),
        }}
      />

      {hasBar && (
        <>
          <Box flexGrow={1} />
          <TabBar ui={ui} active={activeTab} onPlans={back} onNeedsYou={() => void update($, tab, () => 'needs-you')} />
        </>
      )}

      {hasSheet && (
        <MenuSheet
          ui={ui}
          plan={
            project && {
              onNextTask: () => void $.prompt.submit({ text: '/taskflow:next-task' }),
              onPlanStatus: () => void $.prompt.submit({ text: '/taskflow:plan-status' }),
              onAskDelete: () => {
                void update($, isMenuOpen, () => false)
                void update($, pendingDelete, () => project.name)
              },
            }
          }
          onRefresh={() => {
            void update($, isMenuOpen, () => false)
            void loadBoard($)
          }}
          onSettings={() => {
            void update($, isMenuOpen, () => false)
            void openSettings($)
          }}
          onOpenTrash={() => {
            void update($, isMenuOpen, () => false)
            void openTrash($)
          }}
        />
      )}
    </Box>
  )
}

type PaneActions = {
  open: (name: string) => void
  back: () => void
  toggleMenu: () => void
  nextTask: () => void
  openSettings: () => void
  confirmDelete: (name: string) => void
  cancelDelete: () => void
  openTrash: () => void
  closeTrash: () => void
  recover: (entry: string) => void
  askClear: () => void
  confirmClear: () => void
  cancelClear: () => void
}

type PaneContentProps = {
  ui: Ui
  board: PlanBoard
  columns: number
  project: PlanProject | undefined
  deleting: string | null
  trash: TrashEntry[] | null
  tab: Tab
  isClearing: boolean
  isMenuOpen: boolean
  message: string | null
  actions: PaneActions
}

const PaneContent = ({
  ui,
  board: state,
  columns,
  project,
  deleting,
  trash,
  tab: activeTab,
  isClearing,
  isMenuOpen,
  message,
  actions,
}: PaneContentProps) => {
  const { Box, Text, Button } = ui

  return trash !== null ? (
    <TrashView
      ui={ui}
      entries={trash}
      isClearing={isClearing}
      message={message}
      onBack={actions.closeTrash}
      onRecover={actions.recover}
      onAskClear={actions.askClear}
      onConfirmClear={actions.confirmClear}
      onCancelClear={actions.cancelClear}
    />
  ) : state.projects.length === 0 ? (
    <Box flexDirection="column">
      {state.planDir === null ? (
        <Text color="error">{state.planDirError}</Text>
      ) : (
        <Text dimColor>No plans in {state.planDir.label}.</Text>
      )}
      {message && <Text color="warning">{message}</Text>}
      <Button key="settings" hotkey="s" label="⚙ Settings (s)" onPress={actions.openSettings} />
      {state.planDir !== null && <Button key="trash" hotkey="t" label="🗑️ Trash (t)" onPress={actions.openTrash} />}
    </Box>
  ) : activeTab === 'needs-you' ? (
    <NeedsYouCard ui={ui} items={boardNeedsYou(state.projects)} columns={columns - 4} onOpen={actions.open} />
  ) : project === undefined ? (
    <PlanList
      ui={ui}
      projects={state.projects}
      columns={columns}
      message={message}
      isMenuOpen={isMenuOpen}
      dim={isMenuOpen}
      onOpen={actions.open}
      onToggleMenu={actions.toggleMenu}
    />
  ) : (
    <PlanDetail
      ui={ui}
      board={state}
      project={project}
      columns={columns}
      isDeleting={deleting === project.name}
      isMenuOpen={isMenuOpen}
      dim={isMenuOpen}
      message={message}
      onBack={actions.back}
      onToggleMenu={actions.toggleMenu}
      onNextTask={actions.nextTask}
      onConfirmDelete={() => actions.confirmDelete(project.name)}
      onCancelDelete={actions.cancelDelete}
    />
  )
}
