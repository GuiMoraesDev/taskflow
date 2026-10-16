import type { PlanBoard, PlanProject } from '../../../../types'
import { activeTasks, isQuestionOpen } from '../../../domain/parse'
import { PullRequestItem } from '../molecules/PullRequestItem'
import { TaskItem } from '../molecules/TaskItem'
import type { Ui } from '../ui'

type PlanDetailProps = {
  ui: Ui
  board: PlanBoard
  project: PlanProject
  isDeleting: boolean
  message: string | null
  onBack: () => void
  onNextTask: () => void
  onRefresh: () => void
  onAskDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export function PlanDetail(props: PlanDetailProps) {
  const { ui, board, project, isDeleting, message } = props
  const { Box, Text, Button } = ui
  const active = activeTasks(project.rows)
  const pullRequests = project.rows.filter(row => row.kind === 'pr')
  const opened = pullRequests.filter(row => row.prNumber !== null).length
  const openQuestions = project.rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Button key="back" hotkey="b" label="← Plans (b)" onPress={props.onBack} />
        <Button key="refresh" hotkey="r" label="🔄" onPress={props.onRefresh} />
      </Box>

      <Box flexDirection="column">
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
            <Button key="delete" hotkey="x" label="Delete workspace (x)" onPress={props.onAskDelete} />
          </Box>
        )}
        {message && <Text dimColor>{message}</Text>}
      </Box>
    </Box>
  )
}
