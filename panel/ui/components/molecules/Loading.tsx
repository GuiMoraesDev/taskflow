import { mascotSpinner } from '../../../domain/mascot'
import { MascotSprite } from '../atoms/MascotSprite'
import type { Ui } from '../ui'

type LoadingProps = { ui: Ui; step: number }

export function Loading({ ui, step }: LoadingProps) {
  const { Box, Text } = ui

  return (
    <Box flexDirection="column" alignItems="center">
      <MascotSprite ui={ui} cells={mascotSpinner(step)} />
      <Text dimColor>Loading plans…</Text>
    </Box>
  )
}
