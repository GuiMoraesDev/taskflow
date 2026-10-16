import type { PlanRow } from '../../../types'
import { mascotArt, mascotLine, mascotMood } from '../../domain/mascot'
import type { MascotMood } from '../../domain/mascot'
import { taskTotals } from '../../domain/parse'
import { MascotSprite } from './MascotSprite'
import type { Ui } from './ui'

type MascotProps = { ui: Ui; rows: PlanRow[]; mood?: MascotMood }

// Flo's mood follows the rows it is given, unless a mood is forced.
export function Mascot({ ui, rows, mood: forced }: MascotProps) {
  const { Box, Text } = ui
  const mood = forced ?? mascotMood(rows)
  const { done, total } = taskTotals(rows)

  return (
    <Box flexDirection="column" alignItems="center">
      <MascotSprite ui={ui} cells={mascotArt(mood)} />
      <Text dimColor>{mascotLine(mood, total - done)}</Text>
    </Box>
  )
}
