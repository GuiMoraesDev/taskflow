import type { PlanBoard, PlanProject } from '../../../../types'
import { activeTasks, isQuestionOpen } from '../../../domain/parse'
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
  const openQuestions = project.rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))

  return (
    <Box flexDirection="column" gap={1} flexGrow={1} position="relative">
      <Box justifyContent="space-between">
        <Button key="back" hotkey="b" label="← Plans (b)" onPress={props.onBack} />
        <Button key="menu" hotkey="m" label={isMenuOpen ? '✕ Close (m)' : '☰ Menu (m)'} onPress={props.onToggleMenu} />
      </Box>

      {/* Takes the room left over, so the pull requests and the actions sit at the pane's bottom edge. */}
      <Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        <Text weight="bold">Active tasks</Text>
        {active.length === 0 && <Text color="success">Nothing left to do.</Text>}
        {active.map(row => (
          <TaskItem key={`task-${row.id}`} ui={ui} row={row} />
        ))}
        {openQuestions.length > 0 && (
          <Text color="warning">
            {openQuestions.length} open question(s): {openQuestions.map(row => row.id).join(', ')}
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
              Delete {board.projectsDir}/{project.name}? This cannot be undone.
            </Text>
            <Box gap={2}>
              <Button key="confirm-delete" hotkey="y" label="Yes, delete (y)" onPress={props.onConfirmDelete} />
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

      {/* Last, so it paints over the content; one row down puts it under the Menu button. */}
      {isMenuOpen && (
        <ActionMenu
          top={1}
          right={0}
          ui={ui}
          items={[
            { key: 'refresh', icon: '🔄', label: 'Refresh (r)', hotkey: 'r', onPress: props.onRefresh },
            { key: 'delete', icon: '🗑️', label: 'Delete workspace (x)', hotkey: 'x', onPress: props.onAskDelete },
          ]}
        />
      )}
    </Box>
  )
}
