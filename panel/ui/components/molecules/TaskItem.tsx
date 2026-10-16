import type { PlanRow } from '../../../../types'
import type { Ui } from '../ui'

type TaskItemProps = { ui: Ui; row: PlanRow }

// The status icon keeps its own column, so a long summary wraps under the task's text, not under the icon.
export function TaskItem({ ui: { Box, Text }, row }: TaskItemProps) {
  const [icon = '', ...label] = row.status.split(' ')
  const tone = icon === '🔄' ? 'warning' : icon === '🚧' ? 'error' : 'subtle'

  return (
    <Box gap={1}>
      <Text>{icon}</Text>
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">
          <Text weight="bold">{row.id}</Text> <Text color={tone}>{label.join(' ')}</Text>
          {row.owner && <Text dimColor> · {row.owner}</Text>}
        </Text>
        <Text dimColor>{row.summary}</Text>
      </Box>
    </Box>
  )
}
