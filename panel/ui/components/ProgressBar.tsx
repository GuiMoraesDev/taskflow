import type { Ui } from './ui'

type ProgressBarProps = { ui: Ui; done: number; total: number; width: number }

export function ProgressBar({ ui: { Text }, done, total, width }: ProgressBarProps) {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)

  return (
    <Text>
      <Text color="success">{'█'.repeat(filled)}</Text>
      <Text dimColor>{'░'.repeat(width - filled)}</Text>
    </Text>
  )
}
