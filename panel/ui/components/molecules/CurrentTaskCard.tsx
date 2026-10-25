import type { PlanRow } from '../../../../types'
import { palette } from '../palette'
import type { Ui } from '../ui'

type CurrentTaskCardProps = { ui: Ui; task: PlanRow }

export function CurrentTaskCard({ ui: { Box, Text }, task }: CurrentTaskCardProps) {
  const blocked = task.status.startsWith('🚧')
  const tone = blocked ? palette.red : palette.amber

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={palette.cardBorder} paddingX={1}>
      <Text wrap="truncate-end">
        <Text color={tone}>
          {blocked ? '🚧' : '🔄'} {task.id}
        </Text>
        <Text color={palette.muted}> {task.summary}</Text>
        <Text color={tone}> · {blocked ? 'blocked' : 'in progress'}</Text>
      </Text>
    </Box>
  )
}
