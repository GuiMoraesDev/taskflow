import type { NeedsYouItem } from '../../../domain/attention'
import { palette } from '../palette'
import type { Ui } from '../ui'

type NeedsYouCardProps = { ui: Ui; items: NeedsYouItem[]; columns: number; onOpen: (name: string) => void }

const titleOf = (item: NeedsYouItem) =>
  item.kind === 'question'
    ? `Answer ${item.id}`
    : item.kind === 'review'
      ? `Review PR #${item.prNumber}`
      : `Agree criteria for ${item.id}`

const subOf = (item: NeedsYouItem) =>
  item.kind === 'question'
    ? `${item.plan}${item.unblocks ? ` · unblocks ${item.unblocks}` : ''}`
    : item.kind === 'review'
      ? `${item.plan} · marked ready`
      : item.plan

export function NeedsYouCard({ ui, items, columns, onOpen }: NeedsYouCardProps) {
  const { Box, Text, Button } = ui

  if (items.length === 0) return null

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={palette.amber}
      backgroundColor={palette.amberCard}
      paddingX={1}
    >
      <Text weight="bold" color={palette.amber}>
        ▲ Needs you · {items.length}
      </Text>
      {items.map((item, index) => (
        <Box key={`need-${item.project}-${item.id}`} flexDirection="column">
          {index > 0 && <Text color={palette.amberDivider}>{'─'.repeat(columns)}</Text>}
          <Box justifyContent="space-between" width="100%">
            <Box flexDirection="column">
              <Button key={`open-${item.project}-${item.id}`} plain onPress={() => onOpen(item.project)}>
                <Text color={palette.text}>{titleOf(item)}</Text>
              </Button>
              <Text color={palette.muted} wrap="truncate-end">
                {subOf(item)}
              </Text>
            </Box>
            <Text color={palette.amber}>›</Text>
          </Box>
        </Box>
      ))}
    </Box>
  )
}
