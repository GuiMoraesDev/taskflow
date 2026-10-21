import type { PlanBoard, PlanProject } from '../../../../types'
import { activeTasks, openQuestions } from '../../../domain/parse'
import { ActionMenu } from '../molecules/ActionMenu'
import { PullRequestItem } from '../molecules/PullRequestItem'
import { TaskItem } from '../molecules/TaskItem'
import type { Ui } from '../ui'

type PlanDetailProps = {
  ui: Ui
  board: PlanBoard
  project: PlanProject
  isDeleting: boolean
  isMenuOpen: boolean
  message: string | null
  onBack: () => void
  onToggleMenu: () => void
  onNextTask: () => void
  onRefresh: () => void
  onAskDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export function PlanDetail(props: PlanDetailProps) {
  const { ui, board, project, isDeleting, isMenuOpen, message } = props
  const { Box, Text, Button } = ui
  const active = activeTasks(project.rows)
  const pullRequests = project.rows.filter(row => row.kind === 'pr')
  const opened = pullRequests.filter(row => row.prNumber !== null).length
  const questions = openQuestions(project.rows)

  return (
    <Box flexDirection="column" gap={1} flexGrow={1} position="relative">
      <Box justifyContent="space-between">
        <Button key="back" hotkey="b" label="← Plans (b)" onPress={props.onBack} />
        <Button key="menu" hotkey="m" label={isMenuOpen ? '✕ Close (m)' : '☰ Menu (m)'} onPress={props.onToggleMenu} />
      </Box>

      <Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        <Text weight="bold">Active tasks</Text>
        {active.length === 0 && <Text color="success">Nothing left to do.</Text>}
        {active.map(row => (
          <TaskItem key={`task-${row.id}`} ui={ui} row={row} />
        ))}
        {questions.length > 0 && (
          <Text color="warning">
            {questions.length} open question(s): {questions.map(row => row.id).join(', ')}
          </Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text weight="bold">
          Pull requests <Text color="suggestion">{opened}</Text>
          <Text dimColor> created of {pullRequests.length}</Text>
        </Text>
        {pullRequests.map(row => (
          <PullRequestItem
            key={`pr-${row.id}`}
            ui={ui}
            row={row}
            repoUrl={board.repoUrl}
            worktree={row.branch === null ? undefined : board.worktrees[row.branch]}
          />
        ))}
      </Box>

      <Box flexDirection="column">
        {isDeleting ? (
          <Box flexDirection="column">
            <Text color="error" weight="bold">
              Move {board.planDir?.label}/{project.name} to the trash? You can recover it from the trash.
            </Text>
            <Box gap={2}>
              <Button key="confirm-delete" hotkey="y" label="Yes, move to trash (y)" onPress={props.onConfirmDelete} />
              <Button key="cancel-delete" hotkey="n" label="Cancel (n)" onPress={props.onCancelDelete} />
            </Box>
          </Box>
        ) : (
          <Box gap={2}>
            <Button key="next-task" hotkey="t" label="Next task (t)" onPress={props.onNextTask} />
          </Box>
        )}
        {message && <Text dimColor>{message}</Text>}
      </Box>

      {isMenuOpen && (
        <ActionMenu
          top={1}
          right={0}
          ui={ui}
          items={[
            { key: 'refresh', icon: '🔄', label: 'Refresh (r)', hotkey: 'r', onPress: props.onRefresh },
            {
              key: 'delete',
              icon: '🗑️',
              label: 'Move workspace to trash (x)',
              hotkey: 'x',
              onPress: props.onAskDelete,
            },
          ]}
        />
      )}
    </Box>
  )
}
