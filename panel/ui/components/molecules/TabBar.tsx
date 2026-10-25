import { palette } from '../palette'
import type { Ui } from '../ui'

export type Tab = 'plans' | 'needs-you'

type TabBarProps = { ui: Ui; active: Tab; onPlans: () => void; onNeedsYou: () => void }

export function TabBar({ ui, active, onPlans, onNeedsYou }: TabBarProps) {
  const { Box, Text, Button } = ui
  const tone = (tab: Tab) => (active === tab ? palette.purple : palette.muted)

  return (
    <Box justifyContent="space-around">
      <Button key="tab-plans" plain hotkey="p" onPress={onPlans}>
        <Text color={tone('plans')}>▤ Plans</Text>
      </Button>
      <Button key="tab-needs-you" plain hotkey="u" onPress={onNeedsYou}>
        <Text color={tone('needs-you')}>
          <Text color={palette.amber}>▲</Text> Needs you
        </Text>
      </Button>
    </Box>
  )
}
