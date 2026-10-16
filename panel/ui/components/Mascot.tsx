import type { PlanRow } from '../../../types'
import { mascotArt, mascotLine, mascotMood } from '../../domain/mascot'
import { taskTotals } from '../../domain/parse'
import { MascotSprite } from './MascotSprite'
import type { Ui } from './ui'

type MascotProps = { ui: Ui; rows: PlanRow[] }

// Flo heads every view; its mood follows the rows it is given.
export function Mascot({ ui, rows }: MascotProps) {
  const { Box, Text } = ui
  const mood = mascotMood(rows)
  const { done, total } = taskTotals(rows)

  return (
    <Box flexDirection="column" alignItems="center">
      <MascotSprite ui={ui} cells={mascotArt(mood)} />
      <Text dimColor>{mascotLine(mood, total - done)}</Text>
    </Box>
  )
}
