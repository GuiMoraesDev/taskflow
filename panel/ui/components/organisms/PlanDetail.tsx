import type { PlanBoard, PlanProject } from '../../../../types'
import { currentTask, needsYou } from '../../../domain/attention'
import { groupByPullRequest, nextTask } from '../../../domain/plan-shape'
import { CurrentTaskCard } from '../molecules/CurrentTaskCard'
import { NeedsYouCard } from '../molecules/NeedsYouCard'
import { PullRequestItem } from '../molecules/PullRequestItem'
import { palette } from '../palette'
import type { Ui } from '../ui'

type PlanDetailProps = {
  ui: Ui
  board: PlanBoard
  columns: number
  project: PlanProject
  isDeleting: boolean
  isMenuOpen: boolean
  dim: boolean
  message: string | null
  onBack: () => void
  onToggleMenu: () => void
  onNextTask: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export function PlanDetail(props: PlanDetailProps) {
  const { ui, board, project, isDeleting, isMenuOpen, dim, message } = props
  const { Box, Text, Button } = ui
  const groups = groupByPullRequest(project.rows).filter(group => group.pr !== null)
  const opened = groups.filter(group => group.pr?.prNumber !== null).length
  const current = currentTask(project.rows)
  const next = nextTask(project.rows)

  return (
    <Box flexDirection="column" gap={1} flexGrow={1}>
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Button key="back" hotkey="b" label="←" onPress={props.onBack} />
          <Text weight="bold" color={dim ? palette.faint : palette.text}>
            {project.title}
          </Text>
        </Box>
        <Button key="menu" hotkey="m" label={isMenuOpen ? '✕' : '☰'} onPress={props.onToggleMenu} />
      </Box>

      <NeedsYouCard ui={ui} items={needsYou(project)} columns={props.columns - 4} onOpen={() => undefined} />

      {current && <CurrentTaskCard ui={ui} task={current} />}

      <Box flexDirection="column">
        <Text weight="bold" dimColor={dim}>
          Pull requests <Text color="suggestion">{opened}</Text>
          <Text dimColor> created of {groups.length}</Text>
        </Text>
        {groups.map(group => (
          <PullRequestItem
            key={`pr-${group.pr?.id}`}
            ui={ui}
            group={group}
            repoUrl={board.repoUrl}
            worktree={group.pr?.branch ? board.worktrees[group.pr.branch] : undefined}
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
          next && (
            <Button key="next-task" plain hotkey="t" onPress={props.onNextTask}>
              <Text weight="bold" color={dim ? palette.faint : palette.green} wrap="truncate-end">
                ▶ Next: {next.id} {next.summary}
              </Text>
            </Button>
          )
        )}
        {message && <Text dimColor>{message}</Text>}
      </Box>
    </Box>
  )
}
