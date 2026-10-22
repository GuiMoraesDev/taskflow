import type { PlanRow } from '../../../../types'
import { mascotFrame, mascotMood } from '../../../domain/mascot'
import type { FloStatus } from '../../../domain/status'
import { MascotSprite } from '../atoms/MascotSprite'
import { ProgressBar } from '../atoms/ProgressBar'
import type { Ui } from '../ui'

type MascotProps = { ui: Ui; rows: PlanRow[]; status: FloStatus; step: number; waiting: boolean }

export function Mascot({ ui, rows, status, step, waiting }: MascotProps) {
  const { Box, Text } = ui
  const { progress } = status

  return (
    <Box flexDirection="column" alignItems="center">
      <MascotSprite ui={ui} cells={mascotFrame(mascotMood(rows, { waiting }), step)} />
      <Text weight="bold">{status.headline}</Text>
      {progress && (
        <Text>
          <Text dimColor>
            {progress.done}/{progress.total} tasks done ·{' '}
          </Text>
          {progress.done === 0 ? (
            <Text dimColor>Nothing in progress</Text>
          ) : (
            <Text>
              <ProgressBar ui={ui} done={progress.done} total={progress.total} width={12} />{' '}
              <Text dimColor>{Math.round((progress.done / progress.total) * 100)}%</Text>
            </Text>
          )}
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
