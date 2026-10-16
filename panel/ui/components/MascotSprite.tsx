import type { MascotCell } from '../../domain/mascot'
import type { Ui } from './ui'

type MascotSpriteProps = { ui: Ui; cells: MascotCell[][] }

// Draws pixel cells as half blocks: the glyph takes the top pixel's color, its background the bottom one's.
export function MascotSprite({ ui: { Box, Text }, cells }: MascotSpriteProps) {
  return (
    <Box flexDirection="column">
      {cells.map((row, index) => (
        <Text key={`mascot-${index}`}>
          {row.map(({ top, bottom }, column) =>
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
    </Box>
  )
}
