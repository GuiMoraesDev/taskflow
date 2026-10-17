import type { Ui } from '../ui'

export type DialogRow = { key: string; width: number; content: JSX.Element }

type DialogProps = { ui: Ui; rows: DialogRow[]; top: number; right: number; borderColor: string }

const SIDE_PADDING = 1

export function Dialog({ ui: { Box, Text }, rows, top, right, borderColor }: DialogProps) {
  const innerWidth = Math.max(...rows.map(row => row.width)) + SIDE_PADDING * 2
  const border = (text: string) => <Text color={borderColor}>{text}</Text>
  const horizontalEdge = (leftCorner: string, rightCorner: string) =>
    border(`${leftCorner}${'─'.repeat(innerWidth)}${rightCorner}`)
  const emptyLine = (key: string) => <Box key={key}>{border(`│${' '.repeat(innerWidth)}│`)}</Box>
  const contentLine = (row: DialogRow) => (
    <Box key={row.key} flexDirection="row">
      {border(`│${' '.repeat(SIDE_PADDING)}`)}
      {row.content}
      {border(`${' '.repeat(innerWidth - SIDE_PADDING - row.width)}│`)}
    </Box>
  )

  return (
    <Box position="absolute" top={top} right={right} flexDirection="column">
      {horizontalEdge('╭', '╮')}
      {emptyLine('padding-top')}
      {rows.flatMap((row, index) =>
        index === 0 ? [contentLine(row)] : [emptyLine(`gap-${row.key}`), contentLine(row)],
      )}
      {emptyLine('padding-bottom')}
      {horizontalEdge('╰', '╯')}
    </Box>
  )
}
