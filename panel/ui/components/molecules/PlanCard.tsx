import type { PlanProject } from '../../../../types'
import { currentTask, planBadge } from '../../../domain/attention'
import { taskTotals } from '../../../domain/parse'
import { prSegments } from '../../../domain/plan-shape'
import { SegmentedBar } from '../atoms/SegmentedBar'
import { palette } from '../palette'
import type { Ui } from '../ui'

type PlanCardProps = { ui: Ui; project: PlanProject; hotkey: string; columns: number; onOpen: () => void }

const cardChrome = 4

export function PlanCard({ ui, project, hotkey, columns, onOpen }: PlanCardProps) {
  const { Box, Text, Button } = ui
  const { done, total } = taskTotals(project.rows)
  const badge = planBadge(project)
  const current = currentTask(project.rows)
  const count = ` ${done}/${total}`
  const blocked = current?.status.startsWith('🚧') ?? false

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={palette.cardBorder} paddingX={1}>
      <Box justifyContent="space-between">
        <Button key={`open-${project.name}`} plain hotkey={hotkey} onPress={onOpen}>
          <Text weight="bold" color={palette.text}>
            {project.title}
          </Text>
        </Button>
        {badge.kind === 'attention' && <Text color={palette.amber}>▲ {badge.count}</Text>}
        {badge.kind === 'blocked' && <Text color={palette.red}>■ blocked</Text>}
      </Box>
      <Text>
        <SegmentedBar
          ui={ui}
          segments={prSegments(project.rows)}
          width={Math.max(columns - cardChrome - count.length, 4)}
        />
        <Text color={palette.muted}>{count}</Text>
      </Text>
      {current && (
        <Text wrap="truncate-end">
          <Text color={blocked ? palette.red : palette.amber}>
            {blocked ? '🚧' : '🔄'} {current.id}
          </Text>
          <Text color={palette.muted}> {current.summary}</Text>
        </Text>
      )}
    </Box>
  )
}
