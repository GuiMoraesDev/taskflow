import { palette } from '../palette'
import type { Ui } from '../ui'

type MenuSheetItem = { key: string; label: string; hotkey: string; color?: string; onPress: () => void }

type PlanActions = { onNextTask: () => void; onPlanStatus: () => void; onAskDelete: () => void }

type MenuSheetProps = {
  ui: Ui
  plan: PlanActions | undefined
  onRefresh: () => void
  onSettings: () => void
  onOpenTrash: () => void
}

export function MenuSheet({ ui, plan, onRefresh, onSettings, onOpenTrash }: MenuSheetProps) {
  const { Box, Text, Button } = ui
  const section = (title: string, items: MenuSheetItem[]) => (
    <Box flexDirection="column">
      <Text weight="bold" color={palette.muted}>
        {title}
      </Text>
      {items.map(item => (
        <Button key={`sheet-${item.key}`} plain hotkey={item.hotkey} onPress={item.onPress}>
          <Text color={item.color ?? palette.text}>{item.label}</Text>
        </Button>
      ))}
    </Box>
  )

  return (
    <Box
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      flexDirection="column"
      gap={1}
      borderStyle="round"
      borderColor={palette.purple}
      backgroundColor={palette.card}
      paddingX={1}
    >
      {plan &&
        section('THIS PLAN', [
          { key: 'next-task', label: '▶ Next task', hotkey: 'g', onPress: plan.onNextTask },
          { key: 'plan-status', label: '▤ Plan status', hotkey: 'i', onPress: plan.onPlanStatus },
          { key: 'delete', label: '🗑️ Move plan to trash', hotkey: 'x', color: palette.red, onPress: plan.onAskDelete },
        ])}
      {section('TASKFLOW', [
        { key: 'refresh', label: '🔄 Refresh', hotkey: 'r', onPress: onRefresh },
        { key: 'settings', label: '⚙ Settings', hotkey: 's', onPress: onSettings },
        { key: 'trash', label: '🗑️ Trash', hotkey: 'v', onPress: onOpenTrash },
      ])}
    </Box>
  )
}
