import type { PlanRow } from '../../../../types'
import { mascotFrame, mascotMood } from '../../../domain/mascot'
import type { MascotMood } from '../../../domain/mascot'
import { MascotSprite } from '../atoms/MascotSprite'
import type { Ui } from '../ui'

type MascotProps = { ui: Ui; rows: PlanRow[]; status: string[]; step: number; mood?: MascotMood }

// Flo's mood follows the rows it is given, unless a mood is forced; the status lines say what is going on.
export function Mascot({ ui, rows, status, step, mood: forced }: MascotProps) {
  const { Box, Text } = ui
  const [headline, ...details] = status

  return (
    <Box flexDirection="column" alignItems="center">
      <MascotSprite ui={ui} cells={mascotFrame(forced ?? mascotMood(rows), step)} />
      {headline && <Text weight="bold">{headline}</Text>}
      {details.map(line => (
        <Text key={`status-${line}`} dimColor>
          {line}
        </Text>
      ))}
    </Box>
  )
}
