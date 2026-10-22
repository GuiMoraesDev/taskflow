import type { Ui } from '../ui'
import { palette } from '../palette'

type ProgressBarProps = { ui: Ui; done: number; total: number; width: number }

export function ProgressBar({ ui: { Text }, done, total, width }: ProgressBarProps) {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)

  return (
    <Text>
      <Text color={palette.green}>{'█'.repeat(filled)}</Text>
      <Text color={palette.faint}>{'░'.repeat(width - filled)}</Text>
    </Text>
  )
}
