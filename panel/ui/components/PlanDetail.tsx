import type { PlanBoard, PlanProject } from '../../../types'
import { activeTasks, isQuestionOpen, taskTotals } from '../../domain/parse'
import { ProgressBar } from './ProgressBar'
import { PullRequestItem } from './PullRequestItem'
import type { Ui } from './ui'

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
  const { done, total } = taskTotals(project.rows)
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const active = activeTasks(project.rows)
  const pullRequests = project.rows.filter(row => row.kind === 'pr')
  const opened = pullRequests.filter(row => row.prNumber !== null).length
  const openQuestions = project.rows.filter(row => row.kind === 'question' && isQuestionOpen(row.status))

  return (
    <Box flexDirection="column" gap={1}>
      <Button key="back" hotkey="b" label="[b] All plans" onPress={props.onBack} />

      <Box flexDirection="column">
        <Text weight="bold" color="claude">
          {project.title}
        </Text>
        <Text>
          <ProgressBar ui={ui} done={done} total={total} width={20} /> {done}/{total} tasks · {percent}%
        </Text>
      </Box>

      <Box flexDirection="column">
        <Text weight="bold">Active tasks</Text>
        {active.length === 0 && <Text color="success">Nothing left to do.</Text>}
        {active.map(row => (
          <Text key={`task-${row.id}`}>
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
              <Button key="confirm-delete" hotkey="y" label="[y] Yes, delete" onPress={props.onConfirmDelete} />
              <Button key="cancel-delete" hotkey="n" label="[n] Cancel" onPress={props.onCancelDelete} />
            </Box>
          </Box>
        ) : (
          <Box gap={2}>
            <Button key="next-task" hotkey="t" label="[t] Next task" onPress={props.onNextTask} />
            <Button key="refresh" hotkey="r" label="[r] Refresh" onPress={props.onRefresh} />
            <Button key="delete" hotkey="x" label="[x] Delete workspace" onPress={props.onAskDelete} />
          </Box>
        )}
        {message && <Text dimColor>{message}</Text>}
      </Box>
    </Box>
  )
}
