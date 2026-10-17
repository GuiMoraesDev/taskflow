import type { PlanProject } from '../../../../types'
import { openQuestions, taskTotals } from '../../../domain/parse'
import { ProgressBar } from '../atoms/ProgressBar'
import type { Ui } from '../ui'

type PlanCardProps = { ui: Ui; project: PlanProject; hotkey: string; onOpen: () => void }

export function PlanCard({ ui, project, hotkey, onOpen }: PlanCardProps) {
  const { Box, Text, Button } = ui
  const { done, total } = taskTotals(project.rows)
  const working = project.rows.find(row => row.kind === 'task' && /^(🔄|🚧)/.test(row.status))
  const questions = openQuestions(project.rows).length
  const pullRequests = project.rows.filter(row => row.kind === 'pr')
  const opened = pullRequests.filter(row => row.prNumber !== null).length

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Button key={`open-${project.name}`} plain hotkey={hotkey} onPress={onOpen}>
        <Text weight="bold">{project.title}</Text>
      </Button>
      <Text>
        <ProgressBar ui={ui} done={done} total={total} width={12} />{' '}
        <Text dimColor>
          {done}/{total} tasks
        </Text>
      </Text>
      <Text dimColor wrap="truncate-end">
        {working ? `${working.id} ${working.summary}` : done === total ? 'All tasks done' : 'Nothing in progress'}
      </Text>
      <Text dimColor>
        {opened}/{pullRequests.length} PRs opened
        {questions > 0 && <Text color="warning"> · {questions} open question(s)</Text>}
      </Text>
    </Box>
  )
}
