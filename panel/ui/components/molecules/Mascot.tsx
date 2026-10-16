import type { PlanRow } from '../../../../types'
import { mascotFrame, mascotMood } from '../../../domain/mascot'
import type { MascotMood } from '../../../domain/mascot'
import type { FloStatus } from '../../../domain/status'
import { MascotSprite } from '../atoms/MascotSprite'
import { ProgressBar } from '../atoms/ProgressBar'
import type { Ui } from '../ui'

type MascotProps = { ui: Ui; rows: PlanRow[]; status: FloStatus; step: number; mood?: MascotMood }

// Flo's mood follows the rows it is given, unless a mood is forced; the status says what is going on.
export function Mascot({ ui, rows, status, step, mood: forced }: MascotProps) {
  const { Box, Text } = ui
  const { progress } = status

  return (
    <Box flexDirection="column" alignItems="center">
      <MascotSprite ui={ui} cells={mascotFrame(forced ?? mascotMood(rows), step)} />
      <Text weight="bold">{status.headline}</Text>
      {progress && (
        <Text>
          <Text dimColor>
            {progress.done}/{progress.total} tasks done ·{' '}
          </Text>
          <ProgressBar ui={ui} done={progress.done} total={progress.total} width={12} />{' '}
          <Text dimColor>{progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)}%</Text>
        </Text>
      )}
      {status.details.map(line => (
        <Text key={`status-${line}`} dimColor>
          {line}
        </Text>
      ))}
    </Box>
  )
}
