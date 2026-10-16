import type { PlanRow } from '../../../types'
import { mascotArt, mascotLine, mascotMood } from '../../domain/mascot'
import { taskTotals } from '../../domain/parse'
import type { Ui } from './ui'

type MascotProps = { ui: Ui; rows: PlanRow[] }

// Flo heads every view; its mood follows the rows it is given.
export function Mascot({ ui: { Box, Text }, rows }: MascotProps) {
  const mood = mascotMood(rows)
  const { done, total } = taskTotals(rows)

  return (
    <Box flexDirection="column" alignItems="center">
      {mascotArt(mood).map((cells, row) => (
        <Text key={`mascot-${row}`}>
          {cells.map(({ top, bottom }, column) =>
            top ? (
              <Text key={`px-${column}`} color={top} backgroundColor={bottom}>
                ▀
              </Text>
            ) : bottom ? (
              <Text key={`px-${column}`} color={bottom}>
                ▄
              </Text>
            ) : (
              ' '
            ),
          )}
        </Text>
      ))}
      <Text dimColor>{mascotLine(mood, total - done)}</Text>
    </Box>
  )
}
